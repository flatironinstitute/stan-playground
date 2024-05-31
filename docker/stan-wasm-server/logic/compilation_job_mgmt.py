from uuid import uuid4
from string import hexdigits
from pathlib import Path

from .file_validation.compilation_files import write_stan_code_file

from .exceptions import (
    StanPlaygroundAlreadyUploaded,
    StanPlaygroundJobNotFoundException,
    StanPlaygroundInvalidJobException,
    StanPlaygroundInvalidFileException,
)

# NOTE: Consider an explicit root
BASE_JOB_DIR = Path("/jobs")

def create_compilation_job():
    job_id = _create_compilation_job_id()
    get_compilation_job_dir(job_id, create_if_missing=True)
    return job_id


def _create_compilation_job_id():
    return uuid4().hex


def _is_valid_compilation_job_id(job_id: str):
    return len(job_id) == 32 and all(c in hexdigits for c in job_id)


def get_compilation_job_dir(job_id: str, *, create_if_missing: bool = False):
    _validate_compilation_job_id(job_id)
    job_dir = BASE_JOB_DIR / job_id
    if create_if_missing:
        job_dir.mkdir(parents=True)
    else:
        if not job_dir.is_dir():
            raise StanPlaygroundJobNotFoundException(job_id)
    return job_dir


def get_job_source_file(job_id: str, for_writing: bool = False):
    job_dir = get_compilation_job_dir(job_id)
    srcfile = job_dir / "main.stan"

    if not for_writing and not srcfile.exists():
        raise StanPlaygroundInvalidFileException("Not found")
    elif for_writing and srcfile.exists():
        raise StanPlaygroundAlreadyUploaded(f"Cannot upload files to job {job_id}, already uploaded!")
    return srcfile


def _validate_compilation_job_id(job_id: str):
    if not _is_valid_compilation_job_id(job_id):
        raise StanPlaygroundInvalidJobException(job_id)


def _get_compilation_logfile_path(job_id: str):
    job_dir = get_compilation_job_dir(job_id)
    logfile_name = job_dir / "log.txt"
    return logfile_name


def write_compilation_logfile(job_id: str, msg: str):
    log = _get_compilation_logfile_path(job_id)
    with log.open(mode="a") as fp:
        fp.write(msg)


def upload_stan_code_file(job_id: str, filename: str, data: bytes):
    # filename is currently intentionally unused
    file = get_job_source_file(job_id, for_writing=True)
    write_stan_code_file(file, data)
