from random import choice
import time
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header
from fastapi import Body
import os
import subprocess


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SWS_PASSCODE = os.environ.get("SWS_PASSCODE", "")
if not SWS_PASSCODE:
    raise ValueError("SWS_PASSCODE environment variable not set")

TINYSTAN_DIR = os.environ.get("TINYSTAN_DIR", "")
if not TINYSTAN_DIR:
    raise ValueError("TINYSTAN_DIR environment variable not set")


# probe
@app.get("/probe")
async def probe():
    return {"status": "ok"}


@app.post("/job/initiate")
async def initiate_job(authorization: str = Header(None)):
    # Generate a unique job ID
    if not authorization:
        raise HTTPException(status_code=401, detail="Passcode not provided")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    passcode = authorization.split(" ")[1]
    if not _passcode_is_valid(passcode):
        raise HTTPException(status_code=401, detail="Invalid passcode")
    job_id = _create_job_id()
    job_dir = _get_job_dir(job_id)
    os.makedirs(job_dir, exist_ok=True)
    with open(f"{job_dir}/status.txt", "w") as status_file:
        status_file.write("initiated")
    return {"job_id": job_id, "status": "initiated"}


@app.get("/job/{job_id}/status")
async def job_status(job_id: str):
    if not _is_valid_job_id(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    job_dir = _get_job_dir(job_id)
    if not os.path.isdir(job_dir):
        raise HTTPException(status_code=404, detail="Job not found")
    with open(f"{job_dir}/status.txt", "r") as status_file:
        status = status_file.read()
    return {"job_id": job_id, "status": status}


@app.post("/job/{job_id}/upload/{filename}")
async def upload_file(job_id: str, filename: str, data: bytes = Body(...)):
    if not _is_valid_job_id(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    if "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    if filename not in ["main.stan"]:
        raise HTTPException(
            status_code=400, detail=f"Not allowed to upload a file with name {filename}"
        )
    # check that the file is not too large
    if len(data) > 1024 * 1024 * 10:
        raise HTTPException(status_code=400, detail="File too large")
    job_dir = _get_job_dir(job_id)
    if not os.path.isdir(job_dir):
        raise HTTPException(status_code=404, detail="Job not found")
    # get status
    with open(f"{job_dir}/status.txt", "r") as status_file:
        status = status_file.read()
    if status != "initiated":
        raise HTTPException(
            status_code=400, detail=f"Cannot upload files to a job with status {status}"
        )
    file_location = f"{job_dir}/{filename}"
    with open(file_location, "wb") as file_object:
        file_object.write(data)
    return {"success": True}


@app.get("/job/{job_id}/download/{filename}")
async def download_file(job_id: str, filename: str):
    if not _is_valid_job_id(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    # make sure filename is not a path, just a name
    if "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    if filename not in ["main.js", "main.wasm"]:
        raise HTTPException(
            status_code=400,
            detail=f"Not allowed to download a file with name {filename}",
        )
    job_dir = _get_job_dir(job_id)
    if not os.path.isdir(job_dir):
        raise HTTPException(status_code=404, detail="Job not found")
    file_location = f"{job_dir}/{filename}"
    if not os.path.isfile(file_location):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_location)


# Run the job
@app.post("/job/{job_id}/run")
async def run_job(job_id: str):
    if not _is_valid_job_id(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    job_dir = _get_job_dir(job_id)
    if not os.path.isdir(job_dir):
        raise HTTPException(status_code=404, detail="Job not found")
    # get the status
    with open(f"{job_dir}/status.txt", "r") as status_file:
        status = status_file.read()
    if status != "initiated":
        raise HTTPException(
            status_code=400, detail=f"Cannot run a job with status {status}"
        )
    with open(f"{job_dir}/status.txt", "w") as status_file:
        status_file.write("running")
    main_fname = f"{job_dir}/main.stan"
    stan_program_hash = _compute_stan_program_hash(main_fname)
    model_dir = f'{TINYSTAN_DIR}/test_models/{stan_program_hash}'
    if not os.path.exists(os.path.dirname(model_dir)):
        os.makedirs(os.path.dirname(model_dir))
    if os.path.exists(model_dir):
        if os.path.exists(f'{model_dir}/main.js') and os.path.exists(f'{model_dir}/main.wasm'):
            os.system(f"cp {model_dir}/main.js {job_dir}/main.js")
            os.system(f"cp {model_dir}/main.wasm {job_dir}/main.wasm")
            with open(f"{job_dir}/status.txt", "w") as status_file:
                status_file.write("completed")
            return {"job_id": job_id, "status": "completed"}
        else:
            if os.path.exists(f'{model_dir}/running.txt'):
                elapsed_since_modified = time.time() - os.path.getmtime(model_dir)
                if elapsed_since_modified < 60 * 5:
                    # we'll assume that the model is being compiled
                    with open(f"{job_dir}/status.txt", "w") as status_file:
                        status_file.write("running")
                    return {"job_id": job_id, "status": "running"}
                else:
                    # we'll assume that the model failed
                    os.system(f"rm -rf {model_dir}")
            else:
                os.system(f"rm -rf {model_dir}")
    os.makedirs(model_dir, exist_ok=True)
    with open(f'{model_dir}/running.txt', 'w') as running_file:
        running_file.write('running')
    try:
        run_sh_text = _create_run_sh_text(job_dir=job_dir, model_dir=model_dir, tinystan_dir=TINYSTAN_DIR)
        with open(f"{job_dir}/run.sh", "w") as run_sh_file:
            run_sh_file.write(run_sh_text)
        process = subprocess.run(f"bash {job_dir}/run.sh", shell=True, check=False)
        if process.returncode != 0:
            raise Exception(f'Failed to compile model: exit code {process.returncode}')
        if not os.path.exists(f'{model_dir}/main.js') or not os.path.exists(f'{model_dir}/main.wasm'):
            raise Exception('Failed to compile model: missing main.js or main.wasm')
        os.system(f"cp {model_dir}/main.js {job_dir}/main.js")
        os.system(f"cp {model_dir}/main.wasm {job_dir}/main.wasm")
    except Exception as e:
        with open(f"{job_dir}/log.txt", "w") as log_file:
            log_file.write(str(e))
        with open(f"{job_dir}/status.txt", "w") as status_file:
            status_file.write("failed")
        return {"job_id": job_id, "status": "failed"}
    finally:
        os.remove(f'{model_dir}/running.txt')
    with open(f"{job_dir}/status.txt", "w") as status_file:
        status_file.write("completed")
    return {"job_id": job_id, "status": "completed"}


def _compute_stan_program_hash(fname: str):
    import hashlib

    with open(fname, "r") as f:
        stan_program = f.read()
    # TODO: replace stan_program with a canonical form
    return hashlib.sha1(stan_program.encode()).hexdigest()


choices = "abcdefghijklmnopqrstuvwxyz0123456789"


def _create_job_id():
    length_of_id = 20
    return "".join(choice(choices) for _ in range(length_of_id))


def _is_valid_job_id(job_id: str):
    if len(job_id) < 12:
        return False
    if len(job_id) > 40:
        return False
    if not all(c in choices for c in job_id):
        return False
    return True


def _get_job_dir(job_id: str):
    return f"jobs/{job_id}"


def _create_run_sh_text(*, job_dir: str, model_dir: str, tinystan_dir: str):
    ret = f"""#!/bin/bash

cp {job_dir}/main.stan {model_dir}/main.stan

# move to the tinystan directory
cd {tinystan_dir}
emmake make {model_dir}/main.js -j2 && \
emstrip {model_dir}/main.wasm
"""
    return ret


def _passcode_is_valid(passcode: str):
    return passcode == SWS_PASSCODE
