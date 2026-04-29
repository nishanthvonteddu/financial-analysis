from collections.abc import AsyncGenerator
from time import perf_counter
from typing import Any

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.config import get_settings
from src.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


def _before_cursor_execute(
    conn: Any,
    cursor: Any,
    statement: str,
    parameters: Any,
    context: Any,
    executemany: bool,
) -> None:
    conn.info.setdefault("query_start_time", []).append(perf_counter())


def _after_cursor_execute(
    conn: Any,
    cursor: Any,
    statement: str,
    parameters: Any,
    context: Any,
    executemany: bool,
) -> None:
    start_times = conn.info.get("query_start_time")
    if not start_times:
        return

    duration_ms = round((perf_counter() - start_times.pop()) * 1000, 2)
    threshold_ms = get_settings().slow_query_threshold_ms
    if duration_ms <= threshold_ms:
        return

    logger.warning(
        "database.query.slow",
        duration_ms=duration_ms,
        threshold_ms=threshold_ms,
        statement=" ".join(statement.split()),
        executemany=executemany,
    )


def _handle_query_error(exception_context: Any) -> None:
    connection = exception_context.connection
    if connection is None:
        return

    start_times = connection.info.get("query_start_time")
    if start_times:
        start_times.pop()


def _build_engine(database_url: str) -> AsyncEngine:
    engine = create_async_engine(database_url, future=True, pool_pre_ping=True)
    event.listen(engine.sync_engine, "before_cursor_execute", _before_cursor_execute)
    event.listen(engine.sync_engine, "after_cursor_execute", _after_cursor_execute)
    event.listen(engine.sync_engine, "handle_error", _handle_query_error)
    return engine


engine = _build_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


def reset_database(database_url: str) -> None:
    global engine, SessionLocal

    engine = _build_engine(database_url)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(lambda _: None)


async def close_database() -> None:
    await engine.dispose()
