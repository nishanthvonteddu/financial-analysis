from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.router import api_router
from src.config import get_settings
from src.core.database import close_database, init_database
from src.core.logging import configure_logging, get_logger
from src.core.middleware import RequestLoggingMiddleware, SecurityControlsMiddleware


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger = get_logger("app.lifecycle")
    logger.info("application.starting")
    await init_database()
    yield
    await close_database()
    logger.info("application.stopping")


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(json_logs=settings.json_logs, log_level=settings.log_level)

    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)

    app = FastAPI(
        title=settings.app_name,
        description=(
            "API for subscription tracking, statement uploads, dashboard summaries, "
            "workspace settings, and authenticated operator workflows."
        ),
        lifespan=lifespan,
        openapi_tags=[
            {"name": "health", "description": "Service readiness and uptime checks."},
            {
                "name": "auth",
                "description": "Registration, login, token refresh, and workspace reset endpoints.",
            },
            {
                "name": "categories",
                "description": (
                    "User-scoped subscription categories used across forms, "
                    "filters, and dashboards."
                ),
            },
            {
                "name": "payment-methods",
                "description": (
                    "User-scoped payment rails used by subscriptions "
                    "and payment history."
                ),
            },
            {
                "name": "subscriptions",
                "description": "CRUD and filtering for recurring subscription records.",
            },
            {
                "name": "dashboard",
                "description": "Dashboard summary metrics and persistent widget layout state.",
            },
            {
                "name": "expense-reports",
                "description": (
                    "Generated spend reports from uploaded statements, including "
                    "stored chart-ready expense summaries."
                ),
            },
            {
                "name": "exports",
                "description": "Downloadable CSV, JSON, and iCalendar subscription exports.",
            },
            {
                "name": "uploads",
                "description": (
                    "Statement file ingestion, upload history, "
                    "and processing status checks."
                ),
            },
        ],
    )
    app.add_middleware(SecurityControlsMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
