from pathlib import Path
from string import hexdigits
from uuid import uuid4

from .exceptions import (
    StanPlaygroundAlreadyUploaded,
    StanPlaygroundInvalidFileException,
    StanPlaygroundInvalidJobException,
    StanPlaygroundJobNotFoundException,
)
from .file_validation.compilation_files import write_stan_code_file


def create_compilation_job(base_dir: Path) -> str:
    job_id = _create_compilation_job_id()
    get_compilation_job_dir(job_id, base_dir, create_if_missing=True)
    return job_id


def _create_compilation_job_id() -> str:
    return uuid4().hex


def _is_valid_compilation_job_id(job_id: str) -> bool:
    return len(job_id) == 32 and all(c in hexdigits for c in job_id)


def _validate_compilation_job_id(job_id: str) -> None:
    if not _is_valid_compilation_job_id(job_id):
        raise StanPlaygroundInvalidJobException(job_id)


def get_compilation_job_dir(
    job_id: str, base_dir: Path, *, create_if_missing: bool = False
) -> Path:
    _validate_compilation_job_id(job_id)
    job_dir = base_dir / job_id
    if create_if_missing:
        job_dir.mkdir(parents=True)
    else:
        if not job_dir.is_dir():
            raise StanPlaygroundJobNotFoundException(job_id)
    return job_dir


def get_job_source_file(job_dir: Path, for_writing: bool = False) -> Path:
    srcfile = job_dir / "main.stan"

    if not for_writing and not srcfile.exists():
        raise StanPlaygroundInvalidFileException("Not found")
    elif for_writing and srcfile.exists():
        raise StanPlaygroundAlreadyUploaded(
            f"Cannot upload files to job {job_dir.stem}, already uploaded!"
        )
    return srcfile


def upload_stan_code_file(job_dir: Path, data: bytes) -> None:
    file = get_job_source_file(job_dir, for_writing=True)
    write_stan_code_file(file, data)
