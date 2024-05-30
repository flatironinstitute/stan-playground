import asyncio
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


# TODO: This will change substantially if we compile in the job directory directly.
async def try_compile_stan_program(*, job_dir: Path, model_dir: Path, tinystan_dir: Path, preserve_on_fail = False) -> tuple[CompilationStatus, str]:
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
            await compile_model_if_uncompiled(job_dir=job_dir, model_dir=model_dir, tinystan_dir=tinystan_dir, preserve_on_fail=preserve_on_fail)
            copy_compilation_outputs(model_dir=model_dir, job_dir=job_dir)
            return (CompilationStatus.COMPLETED, '')
        # NOTE: Could also include job ID in lockfile and report that here
        return (CompilationStatus.RUNNING, '')
    except Exception as e:
        return (CompilationStatus.FAILED, str(e))
    finally:
        release_compilation_lock(model_dir, nonce)


async def compile_model_if_uncompiled(*, job_dir: Path, model_dir: Path, tinystan_dir: Path, preserve_on_fail = False):
    # Invariant: if compilation output files exist, we should never re-create them, because they either
    # represent the successful compilation of a semantically identical source file
    # or they're leftovers from a prior failed run that intentionally preserved them.
    # So step 1 is check if compilation outputs exist and return if they do.
    # NOTE: preserve_on_fail is implemented to support a debug build, if there are particular model failures
    # that need to be investigated. At present it should always be False.
    if all((model_dir / x).exists() for x in COMPILATION_OUTPUTS):
        return

    try:
        job_main = (job_dir / "main.stan").absolute()
        model_main = (model_dir / "main.stan").absolute()
        copy2(job_main, model_main)
        cmd = f"emmake make {model_main.with_suffix('.js')} && emstrip {model_main.with_suffix('.wasm')}"
        process = await asyncio.create_subprocess_shell(cmd, cwd=tinystan_dir)
        await asyncio.wait_for( process.communicate(), timeout=COMPILATION_TIMEOUT)
    except (asyncio.TimeoutError, TimeoutError):
        _clear_directory_if_not_preserved(model_dir, preserve_on_fail)
        raise StanPlaygroundCompilationTimeoutException()

    if process.returncode != 0:
        _clear_directory_if_not_preserved(model_dir, preserve_on_fail)
        raise StanPlaygroundCompilationException(f'Failed to compile model: exit code {process.returncode}')


def _clear_directory_if_not_preserved(model_dir: Path, preserve_on_fail: bool):
    if not preserve_on_fail:
        rmtree(model_dir)
