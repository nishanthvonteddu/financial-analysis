from __future__ import annotations

from typing import Any

from src.core import database as database_module
from src.services.notification import dispatch_renewal_notifications


async def dispatch_renewal_notifications_job(
    _: dict[str, Any],
    *_args: Any,
    **_kwargs: Any,
) -> None:
    async with database_module.SessionLocal() as session:
        await dispatch_renewal_notifications(session)
