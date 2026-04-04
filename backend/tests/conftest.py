import asyncio

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def app(tmp_path, monkeypatch):
    database_url = f"sqlite+aiosqlite:///{tmp_path / 'test.db'}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key")

    from src.config import get_settings

    get_settings.cache_clear()

    import src.models  # noqa: F401
    from src.core import database as database_module
    from src.core.database import close_database, reset_database
    from src.core.rate_limiter import reset_rate_limits
    from src.main import create_app
    from src.models.base import Base

    reset_database(database_url)
    reset_rate_limits()

    async def prepare_database() -> None:
        async with database_module.engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(prepare_database())

    application = create_app()
    yield application

    asyncio.run(close_database())
    get_settings.cache_clear()


@pytest.fixture
def client(app):
    return TestClient(app)
