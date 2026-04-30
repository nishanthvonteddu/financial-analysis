import time
from uuid import uuid4

import structlog
from starlette.datastructures import URL
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from src.config import get_settings
from src.core.rate_limiter import rate_limiter

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
CSRF_EXEMPT_SUFFIXES = (
    "/auth/login",
    "/auth/refresh",
    "/auth/register",
    "/notifications/telegram/webhook",
)
CACHEABLE_GET_SUFFIXES = (
    "/currencies",
    "/dashboard/score",
    "/dashboard/summary",
)


def _client_host(request: Request) -> str:
    return request.client.host if request.client else "anonymous"


def _origin_allowed(origin: str, allowed_origins: list[str]) -> bool:
    if origin in allowed_origins:
        return True

    try:
        parsed = URL(origin)
    except ValueError:
        return False

    return any(origin == allowed.rstrip("/") for allowed in allowed_origins) or (
        parsed.hostname in {"localhost", "127.0.0.1"} and parsed.scheme in {"http", "https"}
    )


class SecurityControlsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        settings = get_settings()
        content_length = request.headers.get("content-length")
        if (
            content_length
            and content_length.isdigit()
            and int(content_length) > settings.max_request_body_bytes
        ):
            return JSONResponse(
                {"detail": "Request body exceeds the configured size limit."},
                status_code=413,
            )

        if not settings.disable_rate_limiting:
            rate_limiter.check(
                f"global:{_client_host(request)}",
                limit=settings.global_rate_limit,
                window_seconds=settings.global_rate_window_seconds,
            )

        csrf_response = self._validate_csrf(request, settings.backend_cors_origins)
        if csrf_response is not None:
            return csrf_response

        response = await call_next(request)
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        )
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()",
        )
        if settings.security_hsts_enabled:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )
        return response

    def _validate_csrf(self, request: Request, allowed_origins: list[str]) -> Response | None:
        if request.method.upper() in SAFE_METHODS:
            return None
        if not request.url.path.startswith(get_settings().api_v1_prefix):
            return None
        if request.url.path.endswith(CSRF_EXEMPT_SUFFIXES):
            return None
        if not request.headers.get("authorization"):
            return None

        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        browser_origin = origin
        if browser_origin is None and referer:
            browser_origin = str(URL(referer).replace(path="", query="", fragment=""))
        if browser_origin and not _origin_allowed(browser_origin.rstrip("/"), allowed_origins):
            return JSONResponse(
                {"detail": "Cross-site request origin is not allowed."},
                status_code=403,
            )

        if browser_origin and not request.headers.get("x-csrf-token"):
            return JSONResponse({"detail": "CSRF token header is required."}, status_code=403)

        return None


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        start = time.perf_counter()
        logger = structlog.get_logger("request")
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception(
                "http.request.failed",
                method=request.method,
                path=request.url.path,
                duration_ms=duration_ms,
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "http.request.completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        response.headers["x-request-id"] = request_id
        return response


class PrivateCacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        if (
            request.method.upper() == "GET"
            and response.status_code == 200
            and request.url.path.endswith(CACHEABLE_GET_SUFFIXES)
        ):
            response.headers.setdefault("Cache-Control", "private, max-age=30")
            vary_values = {
                value.strip().lower()
                for value in response.headers.get("Vary", "").split(",")
                if value.strip()
            }
            if "authorization" not in vary_values:
                response.headers.append("Vary", "Authorization")
        return response
