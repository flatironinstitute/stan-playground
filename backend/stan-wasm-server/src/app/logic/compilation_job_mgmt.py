import logging
from pathlib import Path
from shutil import rmtree
from uuid import uuid4

from .file_validation.compilation_files import write_stan_code_file

logger = logging.getLogger(__name__)


def create_compilation_job(base_dir: Path) -> Path:
    job_id = _create_compilation_job_id()
    job_dir = base_dir / job_id
    job_dir.mkdir(parents=True)

    return job_dir


def _create_compilation_job_id() -> str:
    return uuid4().hex


def delete_compilation_job(job_dir: Path) -> None:
    logger.info("Deleting %s", job_dir.absolute())
    rmtree(job_dir)


def upload_stan_code_file(job_dir: Path, data: bytes) -> Path:
    file = job_dir / "main.stan"
    write_stan_code_file(file, data)
    return file
