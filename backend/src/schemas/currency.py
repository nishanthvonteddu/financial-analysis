from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class SupportedCurrency(BaseModel):
    code: str
    name: str


class SupportedCurrencyListResponse(BaseModel):
    items: list[SupportedCurrency]


class ExchangeRateResponse(BaseModel):
    base_currency: str
    quote_currency: str
    rate: Decimal
    effective_date: date
    source: str
    is_fallback: bool = False
