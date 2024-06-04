from pydantic import SecretStr

from .exceptions import StanPlaygroundAuthenticationException


def check_authorization(authorization: str, passcode: SecretStr):
    if not authorization:
        raise StanPlaygroundAuthenticationException("Passcode not provided")
    if not authorization.startswith("Bearer "):
        raise StanPlaygroundAuthenticationException("Invalid authorization header")
    user_passcode = authorization.split(" ")[1]
    if not user_passcode == passcode.get_secret_value():
        raise StanPlaygroundAuthenticationException("Invalid passcode")
