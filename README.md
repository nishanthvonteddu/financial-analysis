# MySubscription Tracker

MySubscription Tracker is a full-stack workspace for managing recurring spend. It combines
manual subscription management, statement upload parsing, renewal visibility, household
sharing, analytics, exports, notification preferences, and security hardening into one
operator-focused app.

## Stack

- Backend: FastAPI, SQLAlchemy async, Alembic, PostgreSQL, Redis, ARQ, Structlog, UV
- Frontend: Next.js App Router, React 19, Tailwind CSS, React Query, React Hook Form, Vitest, Playwright
- Data ingestion: CSV and PDF parsing, institution templates, recurring merchant detection, raw transaction storage
- Tooling: Ruff, MyPy, GitHub Actions, Docker Compose, Lighthouse, bundle analyzer

## Repository Layout

```text
backend/                  FastAPI API, models, migrations, services, workers, tests
backend/docs/             API reference and exported OpenAPI schema
frontend/                 Next.js app, shared UI, hooks, tests, Playwright specs
.github/workflows/        Backend and frontend CI pipelines
docker-compose.yml        Local PostgreSQL and Redis services
Makefile                  Common development commands
CHANGELOG.md              30-day milestone history
```

## Quick Start

1. Start infrastructure:

   ```bash
   make dev-infra
   ```

2. Install backend dependencies and run migrations:

   ```bash
   cd backend
   UV_CACHE_DIR=/tmp/uv-cache uv sync --group dev
   UV_CACHE_DIR=/tmp/uv-cache uv run alembic upgrade head
   ```

3. Install frontend dependencies:

   ```bash
   cd frontend
   npm ci
   ```

4. Run the backend and frontend in separate terminals:

   ```bash
   make dev-backend
   make dev-frontend
   ```

The frontend runs on `http://localhost:3000`. The API defaults to
`http://localhost:8000/api/v1`, with interactive OpenAPI docs at
`http://localhost:8000/docs`.

## Environment

Backend settings load from `backend/.env.development` by default. Important variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/mysubscription_tracker` | Primary database |
| `REDIS_URL` | `redis://localhost:6379/0` | Background job queue |
| `JWT_SECRET_KEY` | `dev-secret-change-me` | Access and refresh token signing |
| `FIELD_ENCRYPTION_KEY` | unset | Required outside development/test for encrypted fields |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed browser origins |
| `UPLOAD_JOB_BACKEND` | `inline` | `inline` or Redis-backed worker processing |
| `SENTRY_DSN` | unset | Optional production error reporting |
| `GLOBAL_RATE_LIMIT` | `600` | Requests per window per client |
| `MAX_REQUEST_BODY_BYTES` | `11534336` | Upload/request body cap |

Frontend settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | API origin used by the browser client |

## Common Commands

```bash
make dev-infra       # PostgreSQL and Redis
make dev-backend     # FastAPI reload server
make dev-frontend    # Next.js dev server
make migrate         # Alembic upgrade head
make seed            # Seed default categories
make test            # Backend and frontend unit tests
make lint            # Backend Ruff/MyPy and frontend lint/typecheck
```

Direct checks used by CI:

```bash
cd backend
uv run ruff check .
uv run mypy src
uv run pytest

cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Product Surface

- Public pages: landing page, login, registration, privacy policy
- Authenticated pages: dashboard, uploads, subscriptions, subscription detail, reports, exports,
  score, family, calendar, payments, settings
- Backend domains: authentication, user profile, categories, payment methods, subscriptions,
  uploads, dashboard layout/summary, analytics reports, exports, calendar renewals, family
  sharing, notifications, currency conversion, subscription score

## API Documentation

- Human-readable API guide: `backend/docs/api.md`
- Exported OpenAPI schema: `backend/docs/openapi.json`
- Runtime docs: `http://localhost:8000/docs` and `http://localhost:8000/redoc`

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
