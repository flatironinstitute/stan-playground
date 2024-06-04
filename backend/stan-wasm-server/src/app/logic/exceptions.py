class StanPlaygroundAuthenticationException(Exception):
    """Raise if authentication failed."""


class StanPlaygroundInvalidJobException(Exception):
    """Raise if an invalid job ID is requested."""

    def __init__(self, job_id: str) -> None:
        super().__init__(f"Invalid job ID {job_id}")


class StanPlaygroundJobNotFoundException(Exception):
    """Raise if a job ID is valid but the job directory does not exist."""

    def __init__(self, job_id: str) -> None:
        super().__init__(f"Job ID {job_id} not found")


class StanPlaygroundAlreadyUploaded(Exception):
    """Raise if a request cannot be completed due to the current job status."""


class StanPlaygroundInvalidFileException(Exception):
    """Raise if a submitted file is not valid (e.g. exceeds size limits)"""


class StanPlaygroundCompilationException(Exception):
    """Raise if compilation failed for non-timeout (including unknown) reasons."""


class StanPlaygroundCompilationTimeoutException(Exception):
    """Raise if compilation failed due to timeout specifically."""

    def __init__(self) -> None:
        super().__init__("Model compilation took too long to complete")
