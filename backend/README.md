# FinSight Backend

FastAPI backend for the FinSight financial analysis platform. Handles statement ingestion, transaction storage, spending analytics, subscription detection, exports, family sharing, and notifications.

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

The API listens on `http://localhost:8000` under `/api/v1`. Interactive docs at `/docs` and `/redoc`.

## Configuration

Settings are defined in `src/config.py` and load from `backend/.env.development` by default.

| Variable | Default | Notes |
|---|---|---|
| `APP_NAME` | `FinSight API` | OpenAPI display name |
| `ENVIRONMENT` | `development` | Enables stricter validation outside development/test |
| `API_V1_PREFIX` | `/api/v1` | Versioned API prefix |
| `DATABASE_URL` | local PostgreSQL URL | Async SQLAlchemy connection string |
| `JWT_SECRET_KEY` | `dev-secret-change-me` | Must be changed before production |
| `JWT_ALGORITHM` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | Browser origins allowed for credentialed requests |
| `LOG_LEVEL` | `INFO` | Structlog level |
| `JSON_LOGS` | `false` | Enable JSON log output |
| `SENTRY_DSN` | unset | Optional Sentry integration |
| `STORAGE_BACKEND` | `local` | Upload storage backend |
| `LOCAL_STORAGE_PATH` | `./storage` | Local upload directory |
| `EMAIL_BACKEND` | `console` | Notification email backend |
| `APP_BASE_URL` | `http://localhost:8000` | Base URL for generated links |
| `DISABLE_RATE_LIMITING` | `false` | Development/test escape hatch |
| `GLOBAL_RATE_LIMIT` | `600` | Requests per client per window |
| `GLOBAL_RATE_WINDOW_SECONDS` | `60` | Rate limit window in seconds |
| `MAX_REQUEST_BODY_BYTES` | `11534336` | Request body cap (~11 MB) |
| `FIELD_ENCRYPTION_KEY` | unset | Required outside development/test |
| `SECURITY_HSTS_ENABLED` | `false` | Enable HSTS header behind HTTPS |
| `UPLOAD_JOB_BACKEND` | `inline` | `inline` for dev, `arq` for Redis-backed workers |
| `REDIS_URL` | `redis://localhost:6379/0` | ARQ worker connection |
| `SLOW_QUERY_THRESHOLD_MS` | `500` | Slow SQL logging threshold |

## Commands

```bash
# Run the API server
UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn src.main:app --reload

# Database migrations
UV_CACHE_DIR=/tmp/uv-cache uv run alembic upgrade head

# Seed default categories
UV_CACHE_DIR=/tmp/uv-cache uv run python scripts/seed_categories.py

# Tests and checks
UV_CACHE_DIR=/tmp/uv-cache uv run pytest
UV_CACHE_DIR=/tmp/uv-cache uv run ruff check .
UV_CACHE_DIR=/tmp/uv-cache uv run mypy src
```

## Background Jobs

Uploads default to inline processing for local development. To use Redis-backed async processing:

1. Set `UPLOAD_JOB_BACKEND=arq`
2. Keep Redis running
3. Start the ARQ worker:

```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv run arq src.worker.WorkerSettings
```

The worker handles CSV/PDF statement parsing, raw transaction normalization, recurring subscription detection, exchange-rate refresh, and notification dispatch.

## API Documentation

- `docs/api.md` — Endpoint groups, authentication, and request examples
- `docs/openapi.json` — Exported OpenAPI schema
- `/docs` and `/redoc` — Runtime interactive docs

Regenerate the exported schema after endpoint changes:

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

## Testing the Full Flow

1. Register via `POST /api/v1/auth/register`
2. Create categories and payment methods
3. Upload a CSV or PDF bank statement
4. Review detected transactions, subscriptions, analytics, and reports

All authenticated endpoints require `Authorization: Bearer <access_token>`. State-changing browser requests also send a CSRF header from the frontend client.
