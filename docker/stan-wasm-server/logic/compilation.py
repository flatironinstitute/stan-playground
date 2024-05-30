import tempfile
import subprocess
from hashlib import sha1
from shutil import copy2, rmtree
from pathlib import Path

from .definitions import CompilationStatus
from .locking import get_nonce, acquire_compilation_lock, release_compilation_lock
from .exceptions import StanPlaygroundCompilationException, StanPlaygroundCompilationTimeoutException


COMPILED_MODELS_BASE_PATH = Path('/compiled_models')
COMPILATION_TIMEOUT = 60 * 5
COMPILATION_OUTPUTS = ['main.js', 'main.wasm']


def _compute_stan_program_hash(program_file: Path):
    stan_program = program_file.read_text()
    # TODO: replace stan_program with a canonical form?
    return sha1(stan_program.encode()).hexdigest()


def make_canonical_model_dir(src_file: Path):
    stan_program_hash = _compute_stan_program_hash(src_file)
    model_dir = COMPILED_MODELS_BASE_PATH / stan_program_hash
    model_dir.mkdir(exist_ok=True)
    return model_dir.absolute()


# TODO: Remove this and run directly from the canonical model directory
def copy_compilation_outputs(*, model_dir: Path, job_dir: Path):
    todos = []
    for f in COMPILATION_OUTPUTS:
        src = model_dir / f
        dest = job_dir / f
        if not src.exists():
            raise FileNotFoundError(f"File {src} does not exist.")
        todos.append((src, dest))
    for (src, dest) in todos:
        copy2(src, dest)


# TODO: This will change substantially if we compile in the job directory directly.
# TODO: Revise handling of the tinystan directory.
def try_compile_stan_program(*, job_dir: Path, model_dir: Path, tinystan_dir: str, preserve_on_fail = False) -> tuple[CompilationStatus, str]:
    """Attempts to compile the submitted stan program (if uncompiled) and copy the compiled outputs to the job directory.

    Args:
        job_dir: Job directory for the incoming job
        model_dir: Canonical model directory for the submitted code.
        tinystan_dir: Location of the tinystan installation (with compilation tools)
        preserve_on_fail: May be set to True for debugging purposes, in the event of problematic models. Defaults to False.

    Returns:
        A Tuple of the compilation status and the error message, if any.
    """
    try:
        nonce = get_nonce()
        if acquire_compilation_lock(model_dir, nonce):
            compile_model_if_uncompiled(job_dir=job_dir, model_dir=model_dir, tinystan_dir=tinystan_dir, preserve_on_fail=preserve_on_fail)
            copy_compilation_outputs(model_dir=model_dir, job_dir=job_dir)
            return (CompilationStatus.COMPLETED, '')
        # NOTE: Could also include job ID in lockfile and report that here
        return (CompilationStatus.RUNNING, '')
    except Exception as e:
        return (CompilationStatus.FAILED, str(e))
    finally:
        release_compilation_lock(model_dir, nonce)


def compile_model_if_uncompiled(*, job_dir: Path, model_dir: Path, tinystan_dir: str, preserve_on_fail = False):
    # Invariant: if compilation output files exist, we should never re-create them, because they either
    # represent the successful compilation of a semantically identical source file
    # or they're leftovers from a prior failed run that intentionally preserved them.
    # So step 1 is check if compilation outputs exist and return if they do.
    # NOTE: preserve_on_fail is implemented to support a debug build, if there are particular model failures
    # that need to be investigated. At present it should always be False.
    if all((model_dir / x).exists() for x in COMPILATION_OUTPUTS):
        return

    run_sh_text = _create_run_sh_text(model_dir=model_dir, tinystan_dir=tinystan_dir)
    # TODO: Consider using NamedTemporaryFile when Python target version >= 3.12, as that
    # has native support for reusing the file handle within a context.
    with tempfile.TemporaryDirectory() as tmpdir:
        runfile = Path(tmpdir) / "run.sh"
        runfile.write_text(run_sh_text)
        try:
            # TODO: MAKE THIS ASYNC
            job_main = (job_dir / "main.stan").absolute()
            model_main = (model_dir / "main.stan").absolute()
            copy2(job_main, model_main)
            process = subprocess.run(f"bash {runfile}", shell=True, check=False, timeout=COMPILATION_TIMEOUT)
        except subprocess.TimeoutExpired:
            _clear_directory_if_not_preserved(model_dir, preserve_on_fail)
            raise StanPlaygroundCompilationTimeoutException()
    if process.returncode != 0:
        _clear_directory_if_not_preserved(model_dir, preserve_on_fail)
        raise StanPlaygroundCompilationException(f'Failed to compile model: exit code {process.returncode}')


def _create_run_sh_text(*, model_dir: Path, tinystan_dir: str):
    model_main = (model_dir / "main.stan").absolute()
    tinystan_path = Path(tinystan_dir).absolute()

    ret = f"""#!/bin/bash

emmake make -c {tinystan_path} {model_main.with_suffix('.js')} \
    && emstrip {model_main.with_suffix('.wasm')}
"""
    return ret


def _clear_directory_if_not_preserved(model_dir: Path, preserve_on_fail: bool):
    if not preserve_on_fail:
        rmtree(model_dir)
