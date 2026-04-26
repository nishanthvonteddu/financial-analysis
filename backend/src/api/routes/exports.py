from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.services.export import build_export_payload

router = APIRouter(prefix="/exports", tags=["exports"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
ExportFormatQuery = Annotated[Literal["csv", "json", "ics"], Query(alias="format")]


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Export subscription data",
    description=(
        "Download authenticated subscription data as CSV, JSON, or iCalendar with "
        "attachment headers suitable for browser downloads."
    ),
)
async def export_subscriptions_route(
    session: DbSession,
    current_user: CurrentUser,
    export_format: ExportFormatQuery = "csv",
    active_only: bool = Query(default=False),
    include_payment_history: bool = Query(default=True),
    calendar_months: int = Query(default=12, ge=1, le=24),
) -> Response:
    payload = await build_export_payload(
        session,
        user=current_user,
        export_format=export_format,
        active_only=active_only,
        include_payment_history=include_payment_history,
        calendar_months=calendar_months,
    )
    return Response(
        content=payload.content,
        media_type=payload.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{payload.filename}"',
            "X-Content-Type-Options": "nosniff",
        },
    )
