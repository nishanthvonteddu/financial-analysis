from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.currency import ExchangeRateResponse, SupportedCurrencyListResponse
from src.services.currency import (
    SUPPORTED_CURRENCIES,
    get_exchange_rate_response,
)

router = APIRouter(prefix="/currencies", tags=["currencies"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "",
    response_model=SupportedCurrencyListResponse,
    status_code=status.HTTP_200_OK,
    summary="List supported currencies",
)
async def list_supported_currencies(_: CurrentUser) -> SupportedCurrencyListResponse:
    return SupportedCurrencyListResponse(items=list(SUPPORTED_CURRENCIES))


@router.get(
    "/rate",
    response_model=ExchangeRateResponse,
    status_code=status.HTTP_200_OK,
    summary="Get an exchange rate",
)
async def get_exchange_rate_route(
    session: DbSession,
    _: CurrentUser,
    base_currency: Annotated[str, Query(min_length=3, max_length=3)] = "USD",
    quote_currency: Annotated[str, Query(min_length=3, max_length=3)] = "USD",
    effective_date: date | None = None,
) -> ExchangeRateResponse:
    return await get_exchange_rate_response(
        session,
        base_currency=base_currency,
        quote_currency=quote_currency,
        effective_date=effective_date,
    )
