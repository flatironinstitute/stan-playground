from os import getpid
import time
from pathlib import Path

def get_nonce():
    return str(getpid()) + str(time.time())


def _get_compilation_lockfile_name(model_dir: Path):
    p = model_dir / "running.txt"
    return p


def acquire_compilation_lock(model_dir: Path, nonce: str):
    lockfile = _get_compilation_lockfile_name(model_dir)
    try:
        with lockfile.open(mode='x') as file:
            file.write(nonce)
        contents = lockfile.read_text()
        return contents == nonce
    except:
        return False


def release_compilation_lock(model_dir: Path, nonce: str):
    lockfile = _get_compilation_lockfile_name(model_dir)
    try:
        contents = lockfile.read_text()
        if contents == nonce:
            lockfile.unlink(missing_ok=True)
    except FileNotFoundError:
        return


def compilation_lock_exists(model_dir: Path):
    lockfile = _get_compilation_lockfile_name(model_dir)
    return lockfile.exists()
