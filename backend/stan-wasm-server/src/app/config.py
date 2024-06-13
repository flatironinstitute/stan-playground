import logging
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import (
    AliasChoices,
    BeforeValidator,
    DirectoryPath,
    Field,
    PositiveInt,
    SecretStr,
    field_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict

LogLevelStr = Annotated[
    Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], BeforeValidator(str.upper)
]


class StanWasmServerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SWS_")

    passcode: SecretStr
    job_dir: Path = Path("/jobs")
    built_model_dir: Path = Path("/compiled_models")
    compilation_timeout: PositiveInt = 60 * 5
    tinystan: DirectoryPath = Field(
        validation_alias=AliasChoices("tinystan", "tinystan_dir")
    )
    log_level_str: LogLevelStr = Field(default="INFO", validation_alias="sws_log_level")

    @field_validator("tinystan")
    @classmethod
    def tinystan_contains_installation(cls, v: Path) -> Path:
        if not ((v / "Makefile").is_file() and (v / "stan").is_dir()):
            raise ValueError(
                f"Tinystan path '{v}' does not appear to contain a working installation."
            )
        return v.absolute()

    @property
    def log_level(self) -> int:
        return getattr(logging, self.log_level_str, logging.INFO)


@lru_cache
def get_settings() -> StanWasmServerSettings:
    return StanWasmServerSettings()  # type: ignore # see https://github.com/pydantic/pydantic/issues/3753
