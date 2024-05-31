from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header, Body, Request

import os
from pathlib import Path

from logic.definitions import CompilationStatus
from logic.compilation_job_mgmt import (
    create_compilation_job,
    get_job_source_file,
    upload_stan_code_file,
)
from logic.compilation import COMPILATION_OUTPUTS, make_canonical_model_dir, compile_and_cache
from logic.authorization import check_authorization

from logic.exceptions import (
    StanPlaygroundAuthenticationException,
    StanPlaygroundInvalidJobException,
    StanPlaygroundJobNotFoundException,
    StanPlaygroundAlreadyUploaded,
    StanPlaygroundInvalidFileException,
    StanPlaygroundCompilationException,
    StanPlaygroundCompilationTimeoutException,
    )

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tinystan_env_var = os.environ.get("TINYSTAN_DIR")
if tinystan_env_var is None:
    raise ValueError("TINYSTAN_DIR environment variable not set")

TINYSTAN_DIR = Path(tinystan_env_var).absolute()
if not (
    (TINYSTAN_DIR / 'Makefile').is_file()
    and (TINYSTAN_DIR / 'stan').is_dir()
):
    raise RuntimeError(f"Proposed TINYSTAN_DIR {TINYSTAN_DIR} does not appear to contain a working tinystan.")


##### Custom exception handlers
def register_exn_handler(cls, http_code):
    @app.exception_handler(cls)
    async def _(_request: Request, exc: Exception):
        return JSONResponse(
            status_code=int(http_code),
            content={
                "message": str(exc)
            }
        )


exceptions_codes = [
    (StanPlaygroundAuthenticationException, 401),
    (StanPlaygroundInvalidJobException, 400),
    (StanPlaygroundJobNotFoundException, 404),
    (StanPlaygroundAlreadyUploaded, 409),
    (StanPlaygroundInvalidFileException, 400),
    (StanPlaygroundCompilationException, 422),
    # note: may be tempting to make 408, but this triggers a retry in the client
    (StanPlaygroundCompilationTimeoutException, 400),
    (FileNotFoundError, 404),
]

for e in exceptions_codes:
    register_exn_handler(*e)


##### Routing

@app.get("/probe")
async def probe():
    return {"status": "ok"}


@app.post("/job/initiate")
async def initiate_job(authorization: str = Header(None)):
    check_authorization(authorization)
    job_id = create_compilation_job()
    return {"job_id": job_id, "status": CompilationStatus.INITIATED}


@app.post("/job/{job_id}/upload/{filename}")
async def upload_stan_source_file(job_id: str, filename: str, data: bytes = Body(...)):
    # QUERY: Should this endpoint also validate authorization?
    upload_stan_code_file(job_id, filename, data)
    return {"success": True}


@app.get("/job/{job_id}/download/{filename}")
async def download_file(job_id: str, filename: str):
    if filename not in COMPILATION_OUTPUTS:
        raise StanPlaygroundInvalidFileException(f"Invalid file name {filename}")

    src_file = get_job_source_file(job_id)
    model_dir = make_canonical_model_dir(src_file)

    file_path = model_dir / filename
    if not file_path.is_file():
        raise FileNotFoundError(f'File not found: {file_path}')
    return FileResponse(file_path)


@app.post("/job/{job_id}/run")
async def run_job(job_id: str):
    src_file = get_job_source_file(job_id)
    model_dir = make_canonical_model_dir(src_file)

    await compile_and_cache(job_id=job_id, model_dir=model_dir, tinystan_dir=TINYSTAN_DIR)

    return {"job_id": job_id, "status": CompilationStatus.COMPLETED}
