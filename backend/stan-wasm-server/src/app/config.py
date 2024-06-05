import logging
from functools import lru_cache
from pathlib import Path

from pydantic import (
    AliasChoices,
    DirectoryPath,
    Field,
    PositiveInt,
    SecretStr,
    field_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


class StanWasmServerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SWS_")

    passcode: SecretStr
    job_dir: Path = Path("/jobs")
    built_model_dir: Path = Path("/compiled_models")
    compilation_timeout: PositiveInt = 60 * 5
    tinystan: DirectoryPath = Field(
        validation_alias=AliasChoices("tinystan", "tinystan_dir")
    )
    log_level: str = "INFO"

    @field_validator("log_level")
    @classmethod
    def log_level_is_valid(cls, v: str) -> int:
        v = v.upper()
        if v not in ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"):
            raise ValueError(f"Invalid log level: {v}")
        return getattr(logging, v)  # type: ignore

    @field_validator("tinystan")
    @classmethod
    def tinystan_contains_installation(cls, v: Path) -> Path:
        if not ((v / "Makefile").is_file() and (v / "stan").is_dir()):
            raise ValueError(
                f"Tinystan path '{v}' does not appear to contain a working installation."
            )
        return v.absolute()


@lru_cache
def get_settings() -> StanWasmServerSettings:
    return StanWasmServerSettings()  # type: ignore # see https://github.com/pydantic/pydantic/issues/3753
