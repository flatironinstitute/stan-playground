import asyncio
import logging
import time
from hashlib import sha1
from pathlib import Path
from shutil import copy2

from .exceptions import (
    StanPlaygroundCompilationException,
    StanPlaygroundCompilationTimeoutException,
)
from .file_validation.compilation_files import (
    COMPILATION_OUTPUTS,
    compilation_files_exist,
)
from .locking import compilation_output_lock, wait_until_free

logger = logging.getLogger(__name__)


def _compute_stan_program_hash(program_file: Path) -> str:
    stan_program = program_file.read_text()
    # MAYBE: replace stan_program with a canonical form?
    return sha1(stan_program.encode()).hexdigest()


def make_canonical_model_dir(src_file: Path, built_model_dir: Path) -> Path:
    stan_program_hash = _compute_stan_program_hash(src_file)
    model_dir = built_model_dir / stan_program_hash
    model_dir.mkdir(exist_ok=True, parents=True)
    return model_dir.absolute()


def copy_compiled_files_to_cache(job_dir: Path, model_dir: Path) -> None:
    logger.info("Copying compiled files from %s to %s", job_dir, model_dir)
    for file in COMPILATION_OUTPUTS:
        source = job_dir / file
        if not source.exists():
            raise FileNotFoundError(f"Missing compilation output {file}")

        dest = model_dir / file
        if dest.exists():
            # Note: the only way this can happen is if we have a bug in our
            # own code, there is no way for the user to trigger this
            raise FileExistsError(f"Destination {dest} already exists")

        copy2(job_dir / file, model_dir / file)


async def compile_and_cache(
    *, src_file: Path, model_dir: Path, tinystan_dir: Path, timeout: int
) -> None:
    if compilation_files_exist(model_dir):
        # if there's a cache hit, make sure any copying is already complete,
        # then return without compiling
        await wait_until_free(model_dir)
        logger.info("Cache hit for %s: %s", src_file, model_dir)
        return

    # otherwise, compile in our job-specific folder
    await compile_stan_program(
        src_file=src_file, tinystan_dir=tinystan_dir, timeout=timeout
    )

    # then, try to copy into the cache
    with compilation_output_lock(model_dir) as exclusive:
        # if we succeed in getting the lock, it means
        # EITHER we were the first to compile the model (and need to copy),
        # OR a compilation finished and released its lock while
        # we were compiling (and we don't need to copy).
        if exclusive:
            if not compilation_files_exist(model_dir):
                copy_compiled_files_to_cache(src_file.parent, model_dir)
        # if we failed in getting the lock, it means
        # another thread is currently copying, and we wait for them.
        # We do not need to copy, because their version will be
        # equivalent; we wasted some time, but that's ultimately okay
        else:
            await wait_until_free(model_dir)


async def compile_stan_program(
    *, src_file: Path, tinystan_dir: Path, timeout: int
) -> None:
    """
    Compiles the Stan program in the job directory

    Args:
        src_file: Stan file to be compiled
        tinystan_dir: Location of the tinystan installation (with compilation tools)
        timeout: Maximum number of seconds to allow compilation to take
    """
    try:
        cmd = f"emmake make STANCFLAGS=--filename-in-msg=main.stan {src_file.with_suffix('.js')} \
            && emstrip {src_file.with_suffix('.wasm')}"
        logger.info("Compiling in %s", src_file.parent)
        before = time.time()
        process = await asyncio.create_subprocess_shell(
            cmd,
            cwd=tinystan_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
        logger.info("Compilation finished after %.2f seconds", time.time() - before)
    except (asyncio.TimeoutError, TimeoutError):
        raise StanPlaygroundCompilationTimeoutException()

    if process.returncode != 0:
        logger.error(
            "Compilation failed:\nstdout:\n%s\nstderr:\n%s",
            stdout.decode("utf-8"),
            stderr.decode("utf-8"),
        )
        raise StanPlaygroundCompilationException(
            f"Failed to compile model: {stderr.decode('utf-8')}"
        )
