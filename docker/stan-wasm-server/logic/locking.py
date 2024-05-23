import os
import time

def get_nonce():
    return str(os.getpid()) + str(time.time())


def _get_compilation_lockfile_name(model_dir: str):
    return os.path.join(model_dir, "running.txt")


def acquire_compilation_lock(model_dir: str, nonce: str):
    lock_name = _get_compilation_lockfile_name(model_dir)
    try:
        with open(lock_name, 'x') as file:
            file.write(nonce)
        with open(lock_name, 'r') as file:
            contents = file.read()
            return contents == nonce
    except:
        return False


def release_compilation_lock(model_dir: str, nonce: str):
    lock_name = _get_compilation_lockfile_name(model_dir)
    try:
        with open(lock_name, 'r') as file:
            contents = file.read()
            if contents == nonce:
                os.remove(lock_name)
    except FileExistsError:
        return


def compilation_lock_exists(model_dir: str):
    lock_name = _get_compilation_lockfile_name(model_dir)
    return os.path.exists(lock_name)
