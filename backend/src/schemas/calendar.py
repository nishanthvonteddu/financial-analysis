from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class CalendarRenewalItem(BaseModel):
    subscription_id: int
    name: str
    vendor: str
    amount: Decimal
    currency: str
    cadence: str
    status: str
    renewal_date: date
    category_id: int | None
    category_name: str
    payment_method_id: int | None
    payment_method_label: str | None


class CalendarDay(BaseModel):
    date: date
    day: int
    total_amount: Decimal
    renewals: list[CalendarRenewalItem]


class CalendarRenewalResponse(BaseModel):
    year: int
    month: int
    period_start: date
    period_end: date
    total_renewals: int
    days: list[CalendarDay]
