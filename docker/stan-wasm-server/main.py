from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header, Body, Request

import os

from logic.definitions import CompilationStatus
from logic.compilation_job_mgmt import (
    create_compilation_job,
    get_compilation_job_dir,
    get_job_source_file,
    read_compilation_job_status,
    write_compilation_job_status,
    validate_compilation_job_runnable_status,
    upload_stan_code_file,
    get_compiled_file_path,
    write_compilation_logfile
)
from logic.compilation import make_canonical_model_dir, try_compile_stan_program
from logic.authorization import check_authorization
from logic.exceptions import (
    StanPlaygroundJobNotFoundException,
    StanPlaygroundInvalidJobException,
    StanPlaygroundBadStatusException,
    StanPlaygroundInvalidFileException
)

#  NOTE: While less significant than compilation locks, the risk of race conditions also
# applies to tracking status using the file system. Consider implementing a (single-threaded)
# status tracker to track this state globally. (Can also act as a lock server.)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TINYSTAN_DIR = os.environ.get("TINYSTAN_DIR", "")
if not TINYSTAN_DIR:
    raise ValueError("TINYSTAN_DIR environment variable not set")


##### Custom exception handlers

@app.exception_handler(StanPlaygroundInvalidJobException)
async def invalid_job_handler(request: Request, exc: StanPlaygroundInvalidJobException):
    return JSONResponse(
        status_code=400,
        content={
            "message": f"Invalid job ID {str(exc)}"
        }
    )


@app.exception_handler(StanPlaygroundJobNotFoundException)
async def job_not_found_handler(request: Request, exc: StanPlaygroundJobNotFoundException):
    return JSONResponse(
        status_code=404,
        content={
            "message": f"Job {str(exc)} not found."
        }
    )


@app.exception_handler(StanPlaygroundBadStatusException)
async def bad_status_handler(request: Request, exc: StanPlaygroundBadStatusException):
    return JSONResponse(
        status_code=409,
        content={
            "message": str(exc)
        }
    )


@app.exception_handler(StanPlaygroundInvalidFileException)
async def bad_file_handler(request: Request, exc: StanPlaygroundInvalidFileException):
    return JSONResponse(
        status_code=400,
        content={
            "message": str(exc)
        }
    )

##### Routing

@app.get("/probe")
async def probe():
    return {"status": "ok"}


@app.post("/job/initiate")
async def initiate_job(authorization: str = Header(None)):
    (success, reason) = check_authorization(authorization)
    if not success:
        raise HTTPException(status_code=401, detail=reason)
    job_id = create_compilation_job()
    return {"job_id": job_id, "status": CompilationStatus.INITIATED}


@app.get("/job/{job_id}/status")
async def job_status(job_id: str):
    status = read_compilation_job_status(job_id)
    return {"job_id": job_id, "status": status}


@app.post("/job/{job_id}/upload/{filename}")
async def upload_stan_source_file(job_id: str, filename: str, data: bytes = Body(...)):
    # QUERY: Should this endpoint also validate authorization?
    upload_stan_code_file(job_id, filename, data)
    return {"success": True}


@app.get("/job/{job_id}/download/{filename}")
async def download_file(job_id: str, filename: str):
    file_location = get_compiled_file_path(job_id, filename)
    if (file_location == False):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_location)


@app.post("/job/{job_id}/run")
async def run_job(job_id: str):
    job_dir = get_compilation_job_dir(job_id)
    validate_compilation_job_runnable_status(job_id)
    src_file = get_job_source_file(job_id)
    model_dir = make_canonical_model_dir(src_file)

    (status, err_msg) = try_compile_stan_program(job_dir=job_dir, model_dir=model_dir, tinystan_dir=TINYSTAN_DIR, preserve_on_fail=False)
    if (err_msg != ''):
        write_compilation_logfile(job_id, err_msg)
    write_compilation_job_status(job_id, status)
    return {"job_id": job_id, "status": status.value}
    