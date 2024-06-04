import asyncio
from contextlib import contextmanager
from pathlib import Path
from typing import Generator


def _get_compilation_lockfile_name(model_dir: Path):
    p = model_dir / "running.txt"
    return p


async def wait_until_free(model_dir: Path):
    lockfile = _get_compilation_lockfile_name(model_dir)
    while lockfile.is_file():
        await asyncio.sleep(1)


@contextmanager
def compilation_output_lock(model_dir: Path) -> Generator[bool, None, None]:
    """
    Context manager for the lock on the model directory.
    Yields True if the lock was acquired, False otherwise.
    """
    lockfile = _get_compilation_lockfile_name(model_dir)
    try:
        with lockfile.open(mode="x") as file:
            file.write("locked")
    except FileExistsError:
        yield False
    else:
        # we have the lock, so we need to clean it up
        try:
            yield True
        finally:
            lockfile.unlink()
