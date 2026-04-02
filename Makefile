UV_CACHE_DIR ?= /tmp/uv-cache
NPM_CACHE ?= /tmp/npm-cache

.PHONY: dev-infra dev-backend dev-frontend dev test lint migrate seed

dev-infra:
	docker compose up -d postgres redis

dev-backend:
	cd backend && UV_CACHE_DIR=$(UV_CACHE_DIR) uv run uvicorn src.main:app --reload

dev-frontend:
	cd frontend && npm run dev -- --hostname 0.0.0.0

dev:
	make dev-infra
	@printf "Run 'make dev-backend' and 'make dev-frontend' in separate terminals.\n"

test:
	cd backend && UV_CACHE_DIR=$(UV_CACHE_DIR) uv run pytest
	cd frontend && npm run test

lint:
	cd backend && UV_CACHE_DIR=$(UV_CACHE_DIR) uv run ruff check . && UV_CACHE_DIR=$(UV_CACHE_DIR) uv run mypy src
	cd frontend && npm run lint && npm run typecheck

migrate:
	cd backend && UV_CACHE_DIR=$(UV_CACHE_DIR) uv run alembic upgrade head

seed:
	cd backend && UV_CACHE_DIR=$(UV_CACHE_DIR) uv run python scripts/seed_categories.py
