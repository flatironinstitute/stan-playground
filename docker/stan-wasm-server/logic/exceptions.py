from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi import Request


class StanPlaygroundException(Exception):
    """Base exception for the Stan Playground."""
    code: int
    def to_message(self):
        return str(self)

    @classmethod
    def register_handler(cls, app: FastAPI):
        @app.exception_handler(cls)
        async def _(request: Request, exc: cls):
            return JSONResponse(
                status_code=cls.code,
                content={
                    "message": exc.to_message()
                }
            )

class StanPlaygroundAuthenticationException(StanPlaygroundException):
    """Raise if authentication failed."""
    code: int = 401

class StanPlaygroundInvalidJobException(StanPlaygroundException):
    """Raise if an invalid job ID is requested."""
    code: int = 400
    def to_message(self):
        return f"Invalid job ID {self}"

class StanPlaygroundJobNotFoundException(StanPlaygroundException):
    """Raise if a job ID is valid but the job directory does not exist."""
    code: int = 404
    def to_message(self):
        return f"Job {self} not found."

class StanPlaygroundAlreadyUploaded(StanPlaygroundException):
    """Raise if a request cannot be completed due to the current job status."""
    code: int = 409

class StanPlaygroundInvalidFileException(StanPlaygroundException):
    """Raise if a submitted file is not valid (e.g. exceeds size limits)"""
    code: int = 400

class StanPlaygroundCompilationException(StanPlaygroundException):
    """Raise if compilation failed for non-timeout (including unknown) reasons."""
    code: int = 422

class StanPlaygroundCompilationTimeoutException(StanPlaygroundException):
    """Raise if compilation failed due to timeout specifically."""
    code: int = 400
    def to_message(self):
        return "Model compilation took too long to complete"

ALL_EXCEPTIONS = [
    StanPlaygroundAuthenticationException,
    StanPlaygroundInvalidJobException,
    StanPlaygroundJobNotFoundException,
    StanPlaygroundAlreadyUploaded,
    StanPlaygroundInvalidFileException,
    StanPlaygroundCompilationException,
    StanPlaygroundCompilationTimeoutException,
]
