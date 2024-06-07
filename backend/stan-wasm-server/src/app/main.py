from contextlib import asynccontextmanager
from typing import Annotated, Any, AsyncIterator, TypeVar

from config import StanWasmServerSettings, get_settings
from fastapi import Body, Depends, FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from logic.authorization import check_authorization
from logic.compilation import compile_and_cache, make_canonical_model_dir
from logic.compilation_job_mgmt import (
    create_compilation_job,
    get_compilation_job_dir,
    get_job_source_file,
    upload_stan_code_file,
)
from logic.exceptions import (
    StanPlaygroundAlreadyUploaded,
    StanPlaygroundAuthenticationException,
    StanPlaygroundCompilationException,
    StanPlaygroundCompilationTimeoutException,
    StanPlaygroundInvalidFileException,
    StanPlaygroundInvalidJobException,
    StanPlaygroundJobNotFoundException,
)
from logic.file_validation.compilation_files import COMPILATION_OUTPUTS

DependsOnSettings = Annotated[StanWasmServerSettings, Depends(get_settings)]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    setup_logger()
    yield


def setup_logger() -> None:
    import logging

    import uvicorn

    level = get_settings().log_level
    logger = logging.getLogger()
    out = logging.StreamHandler()
    out.setLevel(level)
    out.setFormatter(uvicorn.logging.DefaultFormatter("%(levelprefix)s %(message)s"))
    logger.addHandler(out)
    logger.setLevel(level)


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


##### Custom exception handlers
Exn = TypeVar("Exn", bound=Exception)


def register_exn_handler(cls: type[Exn], http_code: int) -> None:
    @app.exception_handler(cls)
    async def _(_request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=int(http_code), content={"message": str(exc)})


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

DictResponse = dict[str, Any]


@app.get("/probe")
async def probe() -> DictResponse:
    return {"status": "ok"}


@app.post("/job/initiate")
async def initiate_job(
    settings: DependsOnSettings, authorization: str = Header(None)
) -> DictResponse:
    check_authorization(authorization, settings.passcode)
    job_id = create_compilation_job(base_dir=settings.job_dir)
    return {"job_id": job_id}


@app.post("/job/{job_id}/upload/{filename}")
async def upload_stan_source_file(
    job_id: str, filename: str, settings: DependsOnSettings, data: bytes = Body(...)
) -> DictResponse:
    # QUERY: Should this endpoint also validate authorization?
    # note: filename is intentionally ignored, always main.stan
    job_dir = get_compilation_job_dir(job_id, base_dir=settings.job_dir)
    upload_stan_code_file(job_dir, data)
    return {"success": True}


@app.get("/job/{job_id}/download/{filename}")
async def download_file(
    job_id: str, filename: str, settings: DependsOnSettings
) -> FileResponse:
    if filename not in COMPILATION_OUTPUTS:
        raise StanPlaygroundInvalidFileException(f"Invalid file name {filename}")

    job_dir = get_compilation_job_dir(job_id, base_dir=settings.job_dir)
    src_file = get_job_source_file(job_dir)
    model_dir = make_canonical_model_dir(
        src_file=src_file, built_model_dir=settings.built_model_dir
    )

    file_path = model_dir / filename
    if not file_path.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")
    return FileResponse(file_path)


@app.post("/job/{job_id}/run")
async def run_job(job_id: str, settings: DependsOnSettings) -> DictResponse:
    job_dir = get_compilation_job_dir(job_id, base_dir=settings.job_dir)
    src_file = get_job_source_file(job_dir)
    model_dir = make_canonical_model_dir(
        src_file=src_file, built_model_dir=settings.built_model_dir
    )

    await compile_and_cache(
        job_dir=job_dir,
        model_dir=model_dir,
        tinystan_dir=settings.tinystan,
        timeout=settings.compilation_timeout,
    )

    return {"success": True}
