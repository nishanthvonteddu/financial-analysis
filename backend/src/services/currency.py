from __future__ import annotations

import asyncio
import json
from collections.abc import Iterable
from datetime import UTC, date, datetime
from decimal import ROUND_HALF_UP, Decimal
from urllib.parse import urlencode
from urllib.request import urlopen

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.exchange_rate import ExchangeRate
from src.schemas.currency import ExchangeRateResponse, SupportedCurrency

logger = get_logger(__name__)

SUPPORTED_CURRENCIES: tuple[SupportedCurrency, ...] = (
    SupportedCurrency(code="USD", name="US Dollar"),
    SupportedCurrency(code="EUR", name="Euro"),
    SupportedCurrency(code="GBP", name="British Pound"),
    SupportedCurrency(code="CAD", name="Canadian Dollar"),
    SupportedCurrency(code="AUD", name="Australian Dollar"),
    SupportedCurrency(code="JPY", name="Japanese Yen"),
    SupportedCurrency(code="INR", name="Indian Rupee"),
)
SUPPORTED_CURRENCY_CODES = frozenset(currency.code for currency in SUPPORTED_CURRENCIES)
DEFAULT_BASE_CURRENCY = "USD"
FRANKFURTER_URL = "https://api.frankfurter.app/latest"


def _normalize_currency(value: str) -> str:
    normalized = value.strip().upper()
    if len(normalized) != 3 or not normalized.isalpha():
        raise ValueError("Currency must be a 3-letter code.")
    return normalized


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _quantize_rate(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)


async def get_rate(
    session: AsyncSession,
    *,
    base_currency: str,
    quote_currency: str,
    effective_date: date | None = None,
) -> Decimal | None:
    base = _normalize_currency(base_currency)
    quote = _normalize_currency(quote_currency)
    if base == quote:
        return Decimal("1")

    as_of = effective_date or date.today()
    direct = await session.scalar(
        select(ExchangeRate)
        .where(
            ExchangeRate.base_currency == base,
            ExchangeRate.quote_currency == quote,
            ExchangeRate.effective_date <= as_of,
        )
        .order_by(ExchangeRate.effective_date.desc())
    )
    if direct is not None:
        return Decimal(direct.rate)

    inverse = await session.scalar(
        select(ExchangeRate)
        .where(
            ExchangeRate.base_currency == quote,
            ExchangeRate.quote_currency == base,
            ExchangeRate.effective_date <= as_of,
        )
        .order_by(ExchangeRate.effective_date.desc())
    )
    if inverse is not None and Decimal(inverse.rate) != 0:
        return _quantize_rate(Decimal("1") / Decimal(inverse.rate))

    return None


async def convert(
    session: AsyncSession,
    amount: Decimal,
    *,
    from_currency: str,
    to_currency: str,
    effective_date: date | None = None,
) -> Decimal:
    source = _normalize_currency(from_currency)
    target = _normalize_currency(to_currency)
    if source == target:
        return _quantize_money(amount)

    rate = await get_rate(
        session,
        base_currency=source,
        quote_currency=target,
        effective_date=effective_date,
    )
    if rate is None:
        logger.warning(
            "currency.rate_missing_fallback",
            source_currency=source,
            target_currency=target,
            effective_date=(effective_date or date.today()).isoformat(),
        )
        return _quantize_money(amount)

    return _quantize_money(amount * rate)


async def get_exchange_rate_response(
    session: AsyncSession,
    *,
    base_currency: str,
    quote_currency: str,
    effective_date: date | None = None,
) -> ExchangeRateResponse:
    base = _normalize_currency(base_currency)
    quote = _normalize_currency(quote_currency)
    as_of = effective_date or date.today()
    rate = await get_rate(
        session,
        base_currency=base,
        quote_currency=quote,
        effective_date=as_of,
    )
    if rate is None:
        return ExchangeRateResponse(
            base_currency=base,
            quote_currency=quote,
            rate=Decimal("1.000000"),
            effective_date=as_of,
            source="fallback",
            is_fallback=True,
        )

    return ExchangeRateResponse(
        base_currency=base,
        quote_currency=quote,
        rate=_quantize_rate(rate),
        effective_date=as_of,
        source="exchange_rates",
    )


def _fetch_frankfurter_rates(
    base_currency: str,
    quote_currencies: Iterable[str],
) -> dict[str, object]:
    query = urlencode({"from": base_currency, "to": ",".join(sorted(quote_currencies))})
    with urlopen(f"{FRANKFURTER_URL}?{query}", timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


async def refresh_exchange_rates(
    session: AsyncSession,
    *,
    base_currency: str = DEFAULT_BASE_CURRENCY,
    quote_currencies: Iterable[str] | None = None,
) -> int:
    base = _normalize_currency(base_currency)
    quotes = {
        _normalize_currency(currency)
        for currency in (quote_currencies or SUPPORTED_CURRENCY_CODES)
        if _normalize_currency(currency) != base
    }
    if not quotes:
        return 0

    payload = await asyncio.to_thread(_fetch_frankfurter_rates, base, quotes)
    rates = payload.get("rates")
    if not isinstance(rates, dict):
        raise ValueError("Frankfurter response did not include a rates object.")

    effective_date_raw = payload.get("date")
    effective_date = (
        datetime.strptime(str(effective_date_raw), "%Y-%m-%d").date()
        if effective_date_raw
        else datetime.now(UTC).date()
    )

    saved = 0
    for quote, raw_rate in rates.items():
        quote_currency = _normalize_currency(str(quote))
        rate = _quantize_rate(Decimal(str(raw_rate)))
        existing = await session.scalar(
            select(ExchangeRate).where(
                ExchangeRate.base_currency == base,
                ExchangeRate.quote_currency == quote_currency,
                ExchangeRate.effective_date == effective_date,
            )
        )
        if existing is None:
            session.add(
                ExchangeRate(
                    base_currency=base,
                    quote_currency=quote_currency,
                    rate=rate,
                    effective_date=effective_date,
                    source="frankfurter.app",
                )
            )
        else:
            existing.rate = rate
            existing.source = "frankfurter.app"
        saved += 1

    await session.commit()
    logger.info(
        "currency.rates_refreshed",
        base_currency=base,
        quote_count=saved,
        effective_date=effective_date.isoformat(),
    )
    return saved
