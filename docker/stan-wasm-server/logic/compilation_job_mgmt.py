from uuid import uuid4
from string import hexdigits
from pathlib import Path

from .definitions import CompilationStatus
from .file_validation.compilation_files import download_filename_is_valid, write_stan_code_file

from .exceptions import StanPlaygroundBadStatusException, StanPlaygroundJobNotFoundException, StanPlaygroundInvalidJobException, StanPlaygroundInvalidFileException

def create_compilation_job():
    job_id = _create_compilation_job_id()
    get_compilation_job_dir(job_id, create_if_missing=True)
    write_compilation_job_status(job_id, CompilationStatus.INITIATED)
    return job_id


def _create_compilation_job_id():
    return uuid4().hex


def _is_valid_compilation_job_id(job_id: str):
    return len(job_id) == 32 and all(c in hexdigits for c in job_id)


def get_compilation_job_dir(job_id: str, *, create_if_missing: bool = False):
    _validate_compilation_job_id(job_id)
    job_dir = Path("jobs", job_id)
    if create_if_missing:
        job_dir.mkdir(exist_ok=True)
    else:
        if not job_dir.is_dir():
            raise StanPlaygroundJobNotFoundException(job_id)
    return job_dir


def _validate_compilation_job_id(job_id: str):
    if not _is_valid_compilation_job_id(job_id):
        raise StanPlaygroundInvalidJobException(job_id)


def get_compiled_file_path(job_id: str, filename: str):
    job_dir = get_compilation_job_dir(job_id)
    if not download_filename_is_valid(filename):
        raise StanPlaygroundInvalidFileException(f"Invalid file name {filename}")
    file_path = Path(job_dir, filename)
    if not file_path.is_file():
        return False        # TODO Specific error
    return file_path


def validate_compilation_job_runnable_status(job_id: str):
    status = read_compilation_job_status(job_id)
    if status != CompilationStatus.INITIATED.value:
        raise StanPlaygroundBadStatusException(f"Cannot run job {job_id} with status {status}")


def _get_compilation_job_status_file(job_dir: Path):
    return Path(job_dir, "status.txt")


def write_compilation_job_status(job_id: str, status: CompilationStatus):
    job_dir = get_compilation_job_dir(job_id)
    status_file = _get_compilation_job_status_file(job_dir)
    status_file.write_text(status.value)


def read_compilation_job_status(job_id: str):
    job_dir = get_compilation_job_dir(job_id)
    status_file = _get_compilation_job_status_file(job_dir)
    return status_file.read_text()


def _get_compilation_logfile_path(job_id: str):
    job_dir = get_compilation_job_dir(job_id)
    logfile_name = Path(job_dir, "log.txt")
    return logfile_name


def write_compilation_logfile(job_id: str, msg: str):
    log = _get_compilation_logfile_path(job_id)
    with log.open(mode="a") as fp:
        fp.write(msg)


def upload_stan_code_file(job_id: str, filename: str, data: bytes):
    # filename is currently intentionally unused
    status = read_compilation_job_status(job_id)
    if status != CompilationStatus.INITIATED.value:
        raise StanPlaygroundBadStatusException(f"Cannot upload files to job {job_id} with status {status}")
    job_dir = get_compilation_job_dir(job_id)
    (success, msg) = write_stan_code_file(job_dir, data)
    if (not success):
        raise StanPlaygroundInvalidFileException(f"Cannot upload files to job {job_id}: {msg}")
    return True