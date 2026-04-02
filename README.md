# MySubscription Tracker

MySubscription Tracker is a full-stack subscription management app built across daily milestones. Day 1 establishes the backend API skeleton, frontend app shell, local development infrastructure, and CI workflows.

## Stack

- Backend: FastAPI, SQLAlchemy async, Alembic, Structlog, UV
- Frontend: Next.js App Router, Tailwind CSS, React Query, React Hook Form, next-themes
- Tooling: Vitest, Playwright, Ruff, MyPy, Docker Compose, GitHub Actions

## Repository Layout

- `backend/` FastAPI app, models, migrations, seed script, and backend tests
- `frontend/` Next.js app shell, providers, test harness, and UI foundations
- `.github/workflows/` backend and frontend CI pipelines

## Day 1 Commands

```bash
make dev-infra
make dev-backend
make dev-frontend
make test
make lint
make migrate
make seed
```

## Environment Notes

- Backend settings load from `backend/.env.development`.
- Frontend expects `NEXT_PUBLIC_API_BASE_URL` to point at the backend API, defaulting to `http://localhost:8000/api/v1`.
- Docker is required for local Postgres and Redis services.

## Verification Status

This run created the Day 1 bootstrap tree. Package installation through `uv` and `npm` still depends on DNS resolution inside those package managers in the current environment, so CI-oriented config is in place but local dependency install may require a less restricted shell.
