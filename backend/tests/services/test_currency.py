import asyncio
from datetime import date
from decimal import Decimal

from src.core import database as database_module
from src.models.exchange_rate import ExchangeRate
from src.services.currency import convert, get_rate


def _seed_rate(base: str, quote: str, rate: str, effective_date: date) -> None:
    async def _write() -> None:
        async with database_module.SessionLocal() as session:
            session.add(
                ExchangeRate(
                    base_currency=base,
                    quote_currency=quote,
                    rate=Decimal(rate),
                    effective_date=effective_date,
                    source="test",
                )
            )
            await session.commit()

    asyncio.run(_write())


def test_currency_service_converts_direct_and_inverse_rates(app) -> None:
    _seed_rate("USD", "EUR", "0.900000", date(2026, 4, 20))

    async def _read() -> tuple[Decimal | None, Decimal, Decimal]:
        async with database_module.SessionLocal() as session:
            direct = await get_rate(
                session,
                base_currency="USD",
                quote_currency="EUR",
                effective_date=date(2026, 4, 21),
            )
            eur_amount = await convert(
                session,
                Decimal("10.00"),
                from_currency="USD",
                to_currency="EUR",
                effective_date=date(2026, 4, 21),
            )
            usd_amount = await convert(
                session,
                Decimal("9.00"),
                from_currency="EUR",
                to_currency="USD",
                effective_date=date(2026, 4, 21),
            )
            return direct, eur_amount, usd_amount

    direct_rate, converted_to_eur, converted_to_usd = asyncio.run(_read())

    assert direct_rate == Decimal("0.900000")
    assert converted_to_eur == Decimal("9.00")
    assert converted_to_usd == Decimal("10.00")


def test_currency_service_falls_back_to_original_amount_when_rate_missing(app) -> None:
    async def _read() -> Decimal:
        async with database_module.SessionLocal() as session:
            return await convert(
                session,
                Decimal("12.34"),
                from_currency="CAD",
                to_currency="INR",
                effective_date=date(2026, 4, 21),
            )

    assert asyncio.run(_read()) == Decimal("12.34")
