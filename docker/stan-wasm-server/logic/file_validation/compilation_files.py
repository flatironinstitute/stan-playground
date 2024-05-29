from pathlib import Path

# 10 MB limit for Stan source files
MAX_STAN_SRC_FILESIZE = 1024 * 1024 * 10
VALID_STAN_COMPILATION_OUTPUTS_FILENAMES = ['main.js', 'main.wasm']

def download_filename_is_valid(filename: str):
    return filename in VALID_STAN_COMPILATION_OUTPUTS_FILENAMES


def _stan_src_file_is_within_size_limit(data: bytes):
    return len(data) <= MAX_STAN_SRC_FILESIZE


def write_stan_code_file(job_dir: Path, data: bytes):
    if not _stan_src_file_is_within_size_limit(data):
        return (False, "Stan source file too large.")
    file_location = Path(job_dir, "main.stan")
    # TODO: OK to overwrite here?
    file_location.write_bytes(data)
    return (True, "")
