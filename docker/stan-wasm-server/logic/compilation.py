import tempfile
import subprocess
import os
from hashlib import sha1

from .definitions import CompilationStatus
from .locking import get_nonce, acquire_compilation_lock, release_compilation_lock


COMPILATION_TIMEOUT = 60 * 5
COMPILATION_OUTPUTS = ['main.js', 'main.wasm']


def _compute_stan_program_hash(fname: str):
    with open(fname, "r") as f:
        stan_program = f.read()
    # TODO: replace stan_program with a canonical form
    return sha1(stan_program.encode()).hexdigest()


def make_canonical_model_dir(job_id: str, tinystan_dir: str):
    stan_code_file_name = os.path.join(job_id, 'main.stan')
    stan_program_hash = _compute_stan_program_hash(stan_code_file_name)
    model_dir = os.path.join(tinystan_dir, 'test_models', stan_program_hash)
    os.makedirs(model_dir, exist_ok=True)
    return model_dir


def copy_compilation_outputs(*, model_dir: str, job_dir: str):
    todos = []
    for f in COMPILATION_OUTPUTS:
        src = os.path.join(model_dir, f)
        dest = os.path.join(job_dir, f)
        if not os.path.exists(src):
            raise FileNotFoundError(f"File {src} does not exist.")
        todos.append((src, dest))
    for (src, dest) in todos:
        os.system(f"cp {src} {dest}")


def try_compile_stan_program(*, job_dir: str, model_dir: str, tinystan_dir: str, preserve_on_fail = False) -> tuple[CompilationStatus, str]:
    try:
        nonce = get_nonce()
        if acquire_compilation_lock(model_dir, nonce):
            compile_model_if_uncompiled(job_dir=job_dir, model_dir=model_dir, tinystan_dir=tinystan_dir, preserve_on_fail=preserve_on_fail)
            copy_compilation_outputs(model_dir=model_dir, job_dir=job_dir)
            return (CompilationStatus.COMPLETED, '')
        # NOTE: Could also write job ID in lockfile and report that here
        return (CompilationStatus.RUNNING, '')
    except Exception as e:
        return (CompilationStatus.FAILED, str(e))
    finally:
        release_compilation_lock(model_dir, nonce)


def compile_model_if_uncompiled(*, job_dir: str, model_dir: str, tinystan_dir: str, preserve_on_fail = False):
    # Invariant: if compilation output files exist, we should never re-create them, because they either
    # represent the successful compilation of a semantically identical source file
    # or they're leftovers from a prior failed run that intentionally preserved them.
    # So step 1 is check if compilation outputs exist and return if they do.
    if all([os.path.exists(os.path.join(model_dir, x)) for x in COMPILATION_OUTPUTS]):
        return

    run_sh_text = _create_run_sh_text(job_dir=job_dir, model_dir=model_dir, tinystan_dir=tinystan_dir)
    # TODO: Consider using NamedTemporaryFile when Python target version >= 3.12, as that
    # has native support for reusing the file handle within a context.
    with tempfile.TemporaryDirectory() as tmpdir:
        runfile = os.path.join(tmpdir, 'run.sh')
        with open(runfile, 'w') as fp:
            fp.write(run_sh_text)
        try:
            # TODO: MAKE THIS AYSNC
            process = subprocess.run(f"bash {runfile}", shell=True, check=False, timeout=COMPILATION_TIMEOUT)
        except subprocess.TimeoutExpired:
            _clear_directory_if_not_preserved(model_dir, preserve_on_fail)
            raise Exception("Compilation timed out.")
    if process.returncode != 0:
        _clear_directory_if_not_preserved(model_dir, preserve_on_fail)
        raise Exception(f'Failed to compile model: exit code {process.returncode}')


def _create_run_sh_text(*, job_dir: str, model_dir: str, tinystan_dir: str):
    ret = f"""#!/bin/bash

cp {job_dir}/main.stan {model_dir}/main.stan

# move to the tinystan directory
cd {tinystan_dir}
emmake make {model_dir}/main.js -j2 \
    && emstrip {model_dir}/main.wasm
"""
    return ret


def _clear_directory_if_not_preserved(model_dir: str, preserve_on_fail: bool):
    if not preserve_on_fail:
        os.system(f"rm -rf {model_dir}")


