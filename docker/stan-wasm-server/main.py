from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header
from fastapi import Body

import os

from logic.definitions import CompilationStatus
from logic.compilationJobMgmt import (
    create_compilation_job,
    get_compilation_job_dir,
    read_compilation_job_status,
    write_compilation_job_status,
    validate_compilation_job_runnable_status,
    upload_stan_code_file,
    get_compiled_file_location
)
from logic.locking import get_nonce, acquire_compilation_lock, release_compilation_lock
from logic.compilation import compile_model_if_uncompiled, make_canonical_model_dir, copy_compilation_outputs
from logic.authorization import check_authorization

# TODO: While less significant than compilation locks, the risk of race conditions also
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


# probe
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
    success = upload_stan_code_file(job_id, filename, data)
    return {"success": success}


@app.get("/job/{job_id}/download/{filename}")
async def download_file(job_id: str, filename: str):
    file_location = get_compiled_file_location(job_id, filename)
    if (file_location == False):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_location)


@app.post("/job/{job_id}/run")
async def run_job(job_id: str):
    job_dir = get_compilation_job_dir(job_id)
    validate_compilation_job_runnable_status(job_id)

    model_dir = make_canonical_model_dir(job_id, TINYSTAN_DIR)
    status = CompilationStatus.FAILED
    try:
        nonce = get_nonce()
        if acquire_compilation_lock(model_dir, nonce):
            compile_model_if_uncompiled(job_dir=job_dir, model_dir=model_dir, tinystan_dir=TINYSTAN_DIR)
            copy_compilation_outputs(model_dir=model_dir, job_dir=job_dir)
            status = CompilationStatus.COMPLETED
        else:
            status = CompilationStatus.RUNNING
    except Exception as e:
        with open(f"{job_dir}/log.txt", "w") as log_file:
            log_file.write(str(e))
        status = CompilationStatus.FAILED
    finally:
        release_compilation_lock(model_dir, nonce)
        write_compilation_job_status(job_id, status)
    return {"job_id": job_id, "status": status.value}
    