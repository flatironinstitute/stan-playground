from pathlib import Path

from ..exceptions import StanPlaygroundInvalidFileException

COMPILATION_OUTPUTS = ["main.js", "main.wasm"]

# 10 MB limit for Stan source files
MAX_STAN_SRC_FILESIZE = 1024 * 1024 * 10


def download_filename_is_valid(filename: str):
    return filename in COMPILATION_OUTPUTS


def _stan_src_file_is_within_size_limit(data: bytes):
    return len(data) <= MAX_STAN_SRC_FILESIZE


def compilation_files_exist(model_dir: Path):
    return all((model_dir / x).exists() for x in COMPILATION_OUTPUTS)


def write_stan_code_file(file_location: Path, data: bytes):
    if not _stan_src_file_is_within_size_limit(data):
        raise StanPlaygroundInvalidFileException("Stan source file too large.")
    file_location.write_bytes(data)
