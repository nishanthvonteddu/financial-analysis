from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MySubscription Tracker API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/mysubscription_tracker"
    )
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    backend_cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    log_level: str = "INFO"
    json_logs: bool = False
    sentry_dsn: str | None = None
    storage_backend: str = "local"
    local_storage_path: str = "./storage"
    email_backend: str = "console"
    email_from: str = "no-reply@mysubscription-tracker.local"
    app_base_url: str = "http://localhost:8000"
    aws_region: str = "us-east-1"
    aws_bucket_name: str | None = None
    upload_job_backend: str = "inline"
    redis_url: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(
        env_file=".env.development",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
