class StanPlaygroundAuthenticationException(Exception):
    """Raise if authentication failed."""


class StanPlaygroundInvalidFileException(Exception):
    """Raise if a submitted file is not valid (e.g. exceeds size limits)"""


class StanPlaygroundCompilationException(Exception):
    """Raise if compilation failed for non-timeout (including unknown) reasons."""


class StanPlaygroundCompilationTimeoutException(Exception):
    """Raise if compilation failed due to timeout specifically."""

    def __init__(self) -> None:
        super().__init__("Model compilation took too long to complete")
