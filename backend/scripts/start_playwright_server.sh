#!/bin/zsh

set -euo pipefail

BACKEND_DIR=$(cd "$(dirname "$0")/.." && pwd)
DB_PATH=/tmp/mysubscription-playwright-e2e.db
STORAGE_PATH=/tmp/mysubscription-playwright-storage

cd "$BACKEND_DIR"

rm -f "$DB_PATH"
rm -rf "$STORAGE_PATH"

export UV_CACHE_DIR=/tmp/uv-cache
export DATABASE_URL="sqlite+aiosqlite:///$DB_PATH"
export LOCAL_STORAGE_PATH="$STORAGE_PATH"
export BACKEND_CORS_ORIGINS='["http://127.0.0.1:3000"]'
export ACCESS_TOKEN_EXPIRE_MINUTES=120

uv run python - <<'PY'
import asyncio

import src.models  # noqa: F401
from src.core.database import engine
from src.models.base import Base


async def main() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


asyncio.run(main())
PY

uv run uvicorn src.main:app --host 127.0.0.1 --port 8000
