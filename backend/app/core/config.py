from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = "Slack Clone API"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./slack_clone.db"

    cors_origins: str | list[str] = "http://localhost:5173"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            sanitized = value.strip()
            if sanitized.startswith("[") and sanitized.endswith("]"):
                sanitized = sanitized[1:-1]
            return [origin.strip().strip('"').strip("'") for origin in sanitized.split(",") if origin.strip()]
        if isinstance(value, list):
            return [str(origin).strip() for origin in value if str(origin).strip()]
        return []


@lru_cache
def get_settings() -> Settings:
    return Settings()
