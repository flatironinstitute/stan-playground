from uuid import uuid4
from string import hexdigits
import os
from fastapi import HTTPException
from .definitions import CompilationStatus

from .fileValidation.compilationFiles import download_filename_is_valid, write_stan_code_file

### QUERY: It'd be nice to avoid taking a dependency on HTTPException here,
# but the best I can think of to do it is to define a bunch of our own exceptions,
# which would then have to be caught at the routing-functions level, which is
# not a useful encapsulation & will prompt a lot of boilerplate code.
# Thoughts?


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
    job_dir = os.path.join("jobs", job_id)
    if create_if_missing:
        os.makedirs(job_dir, exist_ok=True)
    else:
        if not os.path.isdir(job_dir):
            raise HTTPException(status_code=404, detail="Job not found")
    return job_dir


def _validate_compilation_job_id(job_id: str):
    if not _is_valid_compilation_job_id(job_id):
        raise HTTPException(status_code=400, detail=f"Invalid job ID {job_id}")



def get_compiled_file_location(job_id: str, filename: str):
    job_dir = get_compilation_job_dir(job_id)
    if not download_filename_is_valid(filename):
        # TODO: Error handling
        return False
    file_location = os.path.join(job_dir, filename)
    if not os.path.isfile(file_location):
        return False        # TODO Specific error
    return file_location


def validate_compilation_job_runnable_status(job_id: str):
    status = read_compilation_job_status(job_id)
    if status != CompilationStatus.INITIATED.value:
        raise HTTPException(
            status_code=409, detail=f"Cannot run a job with status {status}"
        )


def _get_compilation_job_status_file(job_dir: str):
    return os.path.join(job_dir, "status.txt")


def write_compilation_job_status(job_id: str, status: CompilationStatus):
    job_dir = get_compilation_job_dir(job_id)
    status_file = _get_compilation_job_status_file(job_dir)
    with open(status_file, "w") as sf:
        sf.write(status.value)


def read_compilation_job_status(job_id: str):
    job_dir = get_compilation_job_dir(job_id)
    status_file = _get_compilation_job_status_file(job_dir)
    with open(status_file, "r") as sf:
        return sf.read()


def _get_compilation_logfile_name(job_id: str):
    job_dir = get_compilation_job_dir(job_id)
    logfile_name = os.path.join(job_dir, "log.txt")
    return logfile_name


def write_compilation_logfile(job_id: str, msg: str):
    log = _get_compilation_logfile_name(job_id)
    with open(log, "a") as fp:
        fp.write(msg)


def upload_stan_code_file(job_id: str, filename: str, data: bytes):
    status = read_compilation_job_status(job_id)
    if status != CompilationStatus.INITIATED.value:
        raise HTTPException(status_code=409, detail=f"Cannot upload files to job with status {status}")
    job_dir = get_compilation_job_dir(job_id)
    (success, msg) = write_stan_code_file(job_dir, filename, data)
    if (not success):
        raise HTTPException(status_code=400, detail=msg)
    return True
