from __future__ import annotations

from typing import Any

from src.core import database as database_module
from src.services.currency import refresh_exchange_rates


async def refresh_exchange_rates_job(
    _: dict[str, Any],
    *_args: Any,
    **_kwargs: Any,
) -> None:
    async with database_module.SessionLocal() as session:
        await refresh_exchange_rates(session)
