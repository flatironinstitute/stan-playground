import time
from pathlib import Path
from contextlib import contextmanager


def _get_compilation_lockfile_name(model_dir: Path):
    p = model_dir / "running.txt"
    return p


def wait_until_free(model_dir: Path):
    lockfile = _get_compilation_lockfile_name(model_dir)
    while lockfile.is_file():
        time.sleep(0.5)


@contextmanager
def compilation_output_lock(model_dir: Path):
    lockfile = _get_compilation_lockfile_name(model_dir)

    acquired = False
    try:
        with lockfile.open(mode='x') as file:
            file.write("locked")

        acquired = True
    except:
        acquired = False

    try:
        yield acquired
    finally:
        if acquired:
            lockfile.unlink(missing_ok=True)


