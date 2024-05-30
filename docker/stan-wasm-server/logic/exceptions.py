class StanPlaygroundAuthenticationException(Exception):
    """Raise if authentication failed."""

class StanPlaygroundCompilationException(Exception):
    """Raise if compilation failed for non-timeout (including unknown) reasons."""

class StanPlaygroundCompilationTimeoutException(Exception):
    """Raise if compilation failed due to timeout specifically."""

class StanPlaygroundInvalidJobException(Exception):
    """Raise if an invalid job ID is requested."""

class StanPlaygroundJobNotFoundException(Exception):
    """Raise if a job ID is valid but the job directory does not exist."""

class StanPlaygroundBadStatusException(Exception):
    """Raise if a request cannot be completed due to the current job status."""

class StanPlaygroundBadNameException(Exception):
    """Raise if a requested filename is invalid."""

class StanPlaygroundInvalidFileException(Exception):
    """Raise if a submitted file is not valid (e.g. exceeds size limits)"""

