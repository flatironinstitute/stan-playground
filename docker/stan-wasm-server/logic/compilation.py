import asyncio
from hashlib import sha1
from shutil import copy2
from pathlib import Path

from .locking import compilation_output_lock, wait_until_free
from .exceptions import StanPlaygroundCompilationException, StanPlaygroundCompilationTimeoutException
from .compilation_job_mgmt import get_job_source_file, get_compilation_job_dir
from .file_validation.compilation_files import COMPILATION_OUTPUTS

COMPILED_MODELS_BASE_PATH = Path('/compiled_models')
COMPILATION_TIMEOUT = 60 * 5


def _compute_stan_program_hash(program_file: Path):
    stan_program = program_file.read_text()
    # MAYBE: replace stan_program with a canonical form?
    return sha1(stan_program.encode()).hexdigest()


def make_canonical_model_dir(src_file: Path):
    stan_program_hash = _compute_stan_program_hash(src_file)
    model_dir = COMPILED_MODELS_BASE_PATH / stan_program_hash
    model_dir.mkdir(exist_ok=True, parents=True)
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

async def compile_and_cache(*, job_id: str, model_dir: Path, tinystan_dir: Path):
    if all((model_dir / x).exists() for x in COMPILATION_OUTPUTS):
        wait_until_free(model_dir)
        return

    await compile_stan_program(job_id=job_id, tinystan_dir=tinystan_dir)

    job_dir = get_compilation_job_dir(job_id)

    with compilation_output_lock(model_dir) as exclusive:
        if exclusive:
            for file in COMPILATION_OUTPUTS:
                copy2(job_dir / file, model_dir / file)
        else:
            wait_until_free(model_dir)



async def compile_stan_program(*, job_id: str, tinystan_dir: Path, ):
    """Attempts to compile the submitted stan program (if uncompiled) and copy the compiled outputs to the job directory.

    Args:
        job_dir: Job directory for the incoming job
        tinystan_dir: Location of the tinystan installation (with compilation tools)

    """
    # Invariant: if compilation output files exist, we should never re-create them, because they either
    # represent the successful compilation of a semantically identical source file
    # or they're leftovers from a prior failed run that intentionally preserved them.
    # So step 1 is check if compilation outputs exist and return if they do.
    # NOTE: preserve_on_fail is implemented to support a debug build, if there are particular model failures
    # that need to be investigated. At present it should always be False.

    try:
        job_main = get_job_source_file(job_id)
        cmd = f"emmake make {job_main.with_suffix('.js')} && emstrip {job_main.with_suffix('.wasm')}"
        process = await asyncio.create_subprocess_shell(cmd, cwd=tinystan_dir)
        await asyncio.wait_for(process.wait(), timeout=COMPILATION_TIMEOUT)
    except (asyncio.TimeoutError, TimeoutError):
        raise StanPlaygroundCompilationTimeoutException()

    if process.returncode != 0:
        raise StanPlaygroundCompilationException(f'Failed to compile model: exit code {process.returncode}')
