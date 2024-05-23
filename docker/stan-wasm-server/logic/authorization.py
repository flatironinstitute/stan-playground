import os

SWS_PASSCODE = os.environ.get("SWS_PASSCODE", "")
if not SWS_PASSCODE:
    raise ValueError("SWS_PASSCODE environment variable not set")


def _passcode_is_valid(passcode: str):
    return passcode == SWS_PASSCODE


def check_authorization(authorization: str):
    if not authorization:
        return (False, "Passcode not provided")
    if not authorization.startswith("Bearer "):
        return (False, "Invalid authorization header")
    passcode = authorization.split(" ")[1]
    if not _passcode_is_valid(passcode):
        return (False, "Invalid passcode")
    
    return (True, "")
