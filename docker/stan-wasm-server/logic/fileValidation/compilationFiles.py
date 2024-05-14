import os

# 10 MB limit for Stan source files
MAX_STAN_SRC_FILESIZE = 1024 * 1024 * 10
VALID_STAN_SRC_FILENAME = 'main.stan'
VALID_STAN_COMPILATION_OUTPUTS_FILENAMES = ['main.js', 'main.wasm']

def download_filename_is_valid(filename: str):
    return filename in VALID_STAN_COMPILATION_OUTPUTS_FILENAMES


def _stan_src_filename_is_valid(filename: str):
    return filename == 'main.stan'


def _stan_src_file_is_within_size_limit(data: bytes):
    return len(data) <= MAX_STAN_SRC_FILESIZE


def write_stan_code_file(job_dir: str, filename: str, data: bytes):
    if not _stan_src_filename_is_valid(filename):
        return (False, f"Filename {filename} is invalid.")
    if not _stan_src_file_is_within_size_limit(data):
        return (False, f"Stan source file too large.")
    file_location = os.path.join(job_dir, filename)
    # TODO: OK to overwrite here?
    with open(file_location, 'wb') as fp:
        fp.write(data)
    return (True, "")
