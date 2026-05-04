# FinSight

FinSight is a personal financial analysis platform. Upload your bank statements, and it tells you exactly where your money is going — what is growing, what is shrinking, and what has quietly been bleeding for months.

The core product is financial intelligence: pattern detection, spend breakdown, trend analysis, and exportable reports — all from a single CSV or PDF drop.

## Stack

- **Backend:** FastAPI, SQLAlchemy async, Alembic, PostgreSQL, Redis, ARQ, Structlog, UV
- **Frontend:** Next.js App Router, React 19, Tailwind CSS, React Query, Vitest, Playwright
- **Data ingestion:** CSV and PDF statement parsing, institution templates, recurring merchant detection, raw transaction storage
- **Tooling:** Ruff, MyPy, GitHub Actions, Docker Compose, bundle analyzer

## Repository Layout

```
backend/                  FastAPI API, models, migrations, services, workers, tests
backend/docs/             API reference and exported OpenAPI schema
frontend/                 Next.js app, UI components, hooks, tests, Playwright specs
.github/workflows/        CI pipelines
docker-compose.yml        Local PostgreSQL and Redis services
Makefile                  Common development commands
```

## Quick Start

**1. Start infrastructure (PostgreSQL + Redis):**

```bash
make dev-infra
```

**2. Install backend dependencies and run migrations:**

```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv sync --group dev
UV_CACHE_DIR=/tmp/uv-cache uv run alembic upgrade head
```

**3. Install frontend dependencies:**

```bash
cd frontend
npm ci
```

**4. Run backend and frontend in separate terminals:**

```bash
make dev-backend    # http://localhost:8000
make dev-frontend   # http://localhost:3000
```

API docs are available at `http://localhost:8000/docs`.

## Environment Variables

**Backend** — loaded from `backend/.env.development`:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/mysubscription_tracker` | Primary database |
| `REDIS_URL` | `redis://localhost:6379/0` | Background job queue |
| `JWT_SECRET_KEY` | `dev-secret-change-me` | Token signing — change before deploying |
| `FIELD_ENCRYPTION_KEY` | unset | Required in production for encrypted fields |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed browser origins |
| `UPLOAD_JOB_BACKEND` | `inline` | `inline` for local dev, `arq` for Redis-backed workers |
| `SENTRY_DSN` | unset | Optional production error reporting |
| `GLOBAL_RATE_LIMIT` | `600` | Requests per window per client |
| `MAX_REQUEST_BODY_BYTES` | `11534336` | Upload body cap (~11 MB) |

**Frontend:**

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | API origin used by the browser |

## Common Commands

```bash
make dev-infra       # Start PostgreSQL and Redis
make dev-backend     # FastAPI dev server with reload
make dev-frontend    # Next.js dev server
make migrate         # Run Alembic migrations
make seed            # Seed default categories
make test            # Backend and frontend unit tests
make lint            # Ruff, MyPy, and frontend lint/typecheck
```

## What It Does

**Financial analysis**
- Upload bank statements (CSV or PDF) and get a full transaction breakdown
- Spending trends over time — by category, merchant, or custom grouping
- Month-over-month and year-over-year comparisons
- Exportable reports in CSV, JSON, and iCalendar formats

**Subscription tracking**
- Automatic recurring charge detection from uploaded statements
- Renewal calendar and upcoming payment visibility
- Manual subscription entry for charges not in statements
- Subscription health score and duplicate detection

**Workspace features**
- Dashboard with configurable widget layout
- Household sharing with per-member privacy controls
- Notification preferences for renewals and anomalies
- Currency conversion for multi-currency accounts

## API Documentation

- Human-readable guide: `backend/docs/api.md`
- Exported schema: `backend/docs/openapi.json`
- Runtime: `http://localhost:8000/docs` and `http://localhost:8000/redoc`

Regenerate the exported schema after API changes:

```bash
cd backend
uv run python - <<'PY'
import json
from pathlib import Path
from src.main import create_app

Path("docs/openapi.json").write_text(
    json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n"
)
PY
```
