from datetime import date, datetime
from decimal import Decimal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


def _normalize_money_currency(value: str) -> str:
    normalized = value.strip().upper()
    if len(normalized) != 3:
        raise ValueError("Currency must be a 3-letter code.")
    return normalized


def _normalize_name(value: str, field_name: str) -> str:
    normalized = value.strip()
    if len(normalized) < 2:
        raise ValueError(f"{field_name} must be at least 2 characters.")
    return normalized


def _normalize_choice(value: str, field_name: str) -> str:
    normalized = value.strip().lower()
    if len(normalized) < 2:
        raise ValueError(f"{field_name} must be at least 2 characters.")
    return normalized


def _normalize_url(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Website URL must be a valid http or https URL.")

    return normalized


class SubscriptionCreate(BaseModel):
    name: str
    vendor: str
    description: str | None = None
    website_url: str | None = None
    amount: Decimal
    currency: str
    cadence: str
    status: str = "active"
    start_date: date
    end_date: date | None = None
    next_charge_date: date | None = None
    day_of_month: int | None = None
    category_id: int | None = None
    payment_method_id: int | None = None
    auto_renew: bool = True
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _normalize_name(value, "Name")

    @field_validator("vendor")
    @classmethod
    def validate_vendor(cls, value: str) -> str:
        return _normalize_name(value, "Vendor")

    @field_validator("description", "notes")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("website_url")
    @classmethod
    def validate_website_url(cls, value: str | None) -> str | None:
        return _normalize_url(value)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("Amount must be greater than zero.")
        return value.quantize(Decimal("0.01"))

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, value: str) -> str:
        return _normalize_money_currency(value)

    @field_validator("cadence")
    @classmethod
    def validate_cadence(cls, value: str) -> str:
        return _normalize_choice(value, "Cadence")

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _normalize_choice(value, "Status")

    @field_validator("day_of_month")
    @classmethod
    def validate_day_of_month(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value < 1 or value > 31:
            raise ValueError("day_of_month must be between 1 and 31.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "SubscriptionCreate":
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date.")
        return self


class SubscriptionUpdate(BaseModel):
    name: str | None = None
    vendor: str | None = None
    description: str | None = None
    website_url: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    cadence: str | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    next_charge_date: date | None = None
    day_of_month: int | None = None
    category_id: int | None = None
    payment_method_id: int | None = None
    auto_renew: bool | None = None
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_name(value, "Name")

    @field_validator("vendor")
    @classmethod
    def validate_vendor(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_name(value, "Vendor")

    @field_validator("description", "notes")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("website_url")
    @classmethod
    def validate_website_url(cls, value: str | None) -> str | None:
        return _normalize_url(value)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        if value <= 0:
            raise ValueError("Amount must be greater than zero.")
        return value.quantize(Decimal("0.01"))

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_money_currency(value)

    @field_validator("cadence")
    @classmethod
    def validate_cadence(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_choice(value, "Cadence")

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_choice(value, "Status")

    @field_validator("day_of_month")
    @classmethod
    def validate_day_of_month(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value < 1 or value > 31:
            raise ValueError("day_of_month must be between 1 and 31.")
        return value


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    category_id: int | None
    payment_method_id: int | None
    name: str
    vendor: str
    description: str | None
    website_url: str | None
    amount: Decimal
    currency: str
    cadence: str
    status: str
    start_date: date
    end_date: date | None
    next_charge_date: date | None
    day_of_month: int | None
    auto_renew: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubscriptionListResponse(BaseModel):
    items: list[SubscriptionResponse]
    total: int
    limit: int
    offset: int


class SubscriptionPaymentHistoryItem(BaseModel):
    id: int
    payment_method_id: int | None
    payment_method_label: str | None
    paid_at: datetime
    amount: Decimal
    currency: str
    payment_status: str
    reference: str | None


class SubscriptionPriceChangeResponse(BaseModel):
    id: int
    effective_date: date
    previous_amount: Decimal
    new_amount: Decimal
    currency: str
    note: str | None


class SubscriptionPaymentHistorySummary(BaseModel):
    payment_count: int
    total_paid: Decimal
    average_payment: Decimal
    latest_payment_amount: Decimal | None = None
    latest_payment_at: datetime | None = None
    first_payment_at: datetime | None = None
    price_change_count: int


class SubscriptionPaymentHistoryResponse(BaseModel):
    subscription_id: int
    subscription_name: str
    summary: SubscriptionPaymentHistorySummary
    items: list[SubscriptionPaymentHistoryItem]
    price_changes: list[SubscriptionPriceChangeResponse]
