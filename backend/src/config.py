from functools import lru_cache

from pydantic import Field, model_validator
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
    telegram_webhook_secret: str | None = None
    disable_rate_limiting: bool = False
    global_rate_limit: int = 600
    global_rate_window_seconds: int = 60
    max_request_body_bytes: int = 11 * 1024 * 1024
    field_encryption_key: str | None = None
    security_hsts_enabled: bool = False
    aws_region: str = "us-east-1"
    aws_bucket_name: str | None = None
    upload_job_backend: str = "inline"
    redis_url: str = "redis://localhost:6379/0"
    slow_query_threshold_ms: int = 500

    @model_validator(mode="after")
    def validate_security_defaults(self) -> "Settings":
        environment = self.environment.lower()
        if (
            environment not in {"development", "test"}
            and self.jwt_secret_key == "dev-secret-change-me"
        ):
            raise ValueError("JWT_SECRET_KEY must be overridden outside development and test.")
        if environment not in {"development", "test"} and not self.field_encryption_key:
            raise ValueError("FIELD_ENCRYPTION_KEY must be set outside development and test.")
        return self

    model_config = SettingsConfigDict(
        env_file=".env.development",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
