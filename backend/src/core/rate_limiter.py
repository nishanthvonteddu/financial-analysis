from collections import defaultdict, deque
from collections.abc import Callable
from time import monotonic

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, deque[float]] = defaultdict(deque)

    def reset(self) -> None:
        self._requests.clear()

    def check(self, key: str, *, limit: int, window_seconds: int) -> None:
        now = monotonic()
        window_start = now - window_seconds
        bucket = self._requests[key]

        while bucket and bucket[0] <= window_start:
            bucket.popleft()

        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Try again in a minute.",
            )

        bucket.append(now)


rate_limiter = InMemoryRateLimiter()


def rate_limit(bucket: str, *, limit: int = 5, window_seconds: int = 60) -> Callable[..., None]:
    def dependency(request: Request) -> None:
        client_host = request.client.host if request.client else "anonymous"
        rate_limiter.check(
            f"{bucket}:{client_host}",
            limit=limit,
            window_seconds=window_seconds,
        )

    return dependency


def reset_rate_limits() -> None:
    rate_limiter.reset()
