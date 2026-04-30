# MySubscription Tracker Backend

FastAPI backend for subscription tracking, statement ingestion, dashboard summaries, analytics,
exports, family sharing, notifications, and security controls.

## Requirements

- Python 3.12
- UV
- PostgreSQL 16
- Redis 7

Start PostgreSQL and Redis from the repository root:

```bash
make dev-infra
```

## Setup

```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv sync --group dev
UV_CACHE_DIR=/tmp/uv-cache uv run alembic upgrade head
UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn src.main:app --reload
```

The API listens on `http://localhost:8000` and serves versioned routes under `/api/v1`.
Interactive docs are available at `/docs` and `/redoc`.

## Configuration

Settings are defined in `src/config.py` and load from `backend/.env.development` by default.

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_NAME` | `MySubscription Tracker API` | OpenAPI display name |
| `ENVIRONMENT` | `development` | Enables stricter production validation outside development/test |
| `API_V1_PREFIX` | `/api/v1` | Versioned API prefix |
| `DATABASE_URL` | local PostgreSQL URL | Async SQLAlchemy database URL |
| `JWT_SECRET_KEY` | `dev-secret-change-me` | Must be changed outside development/test |
| `JWT_ALGORITHM` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | Browser origins allowed for credentialed API calls |
| `LOG_LEVEL` | `INFO` | Structlog level |
| `JSON_LOGS` | `false` | JSON log output switch |
| `SENTRY_DSN` | unset | Optional FastAPI Sentry integration |
| `STORAGE_BACKEND` | `local` | Upload storage backend |
| `LOCAL_STORAGE_PATH` | `./storage` | Local upload storage path |
| `EMAIL_BACKEND` | `console` | Notification email backend |
| `APP_BASE_URL` | `http://localhost:8000` | Base URL for generated links |
| `TELEGRAM_WEBHOOK_SECRET` | unset | Telegram webhook validation |
| `DISABLE_RATE_LIMITING` | `false` | Test/development escape hatch |
| `GLOBAL_RATE_LIMIT` | `600` | Requests per client per window |
| `GLOBAL_RATE_WINDOW_SECONDS` | `60` | Rate limit window size |
| `MAX_REQUEST_BODY_BYTES` | `11534336` | Request body cap |
| `FIELD_ENCRYPTION_KEY` | unset | Required outside development/test |
| `SECURITY_HSTS_ENABLED` | `false` | Enables HSTS header when deployed behind HTTPS |
| `UPLOAD_JOB_BACKEND` | `inline` | Inline processing or Redis-backed worker dispatch |
| `REDIS_URL` | `redis://localhost:6379/0` | ARQ worker connection |
| `SLOW_QUERY_THRESHOLD_MS` | `500` | Slow SQL logging threshold |

## Commands

```bash
UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn src.main:app --reload
UV_CACHE_DIR=/tmp/uv-cache uv run alembic upgrade head
UV_CACHE_DIR=/tmp/uv-cache uv run python scripts/seed_categories.py
UV_CACHE_DIR=/tmp/uv-cache uv run pytest
UV_CACHE_DIR=/tmp/uv-cache uv run ruff check .
UV_CACHE_DIR=/tmp/uv-cache uv run mypy src
```

## Background Jobs

Uploads default to inline processing for local development. To process through Redis/ARQ,
set `UPLOAD_JOB_BACKEND=arq`, keep Redis running, and start the worker:

```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv run arq src.worker.WorkerSettings
```

The worker handles CSV/PDF statement parsing, normalized raw transaction storage, recurring
subscription detection, exchange-rate refresh jobs, and notification dispatch jobs.

## API Documentation

- `docs/api.md` gives endpoint groups, authentication expectations, and request examples.
- `docs/openapi.json` is the exported OpenAPI schema generated from the FastAPI app.
- Runtime OpenAPI docs are available at `/docs` and `/redoc`.

Regenerate the exported schema after endpoint or schema changes:

```bash
UV_CACHE_DIR=/tmp/uv-cache uv run python - <<'PY'
import json
from pathlib import Path
from src.main import create_app

Path("docs/openapi.json").write_text(
    json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n"
)
PY
```

## Test Data Flow

1. Register or log in through `/api/v1/auth`.
2. Create categories and payment methods.
3. Add subscriptions manually or upload CSV/PDF statements.
4. Review detected subscriptions, dashboard widgets, analytics, exports, notifications, and family sharing.

Most authenticated endpoints require `Authorization: Bearer <access_token>`.
State-changing browser requests also send a CSRF header from the frontend API client.
