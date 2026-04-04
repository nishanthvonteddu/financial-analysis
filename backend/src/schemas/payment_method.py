from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class PaymentMethodCreate(BaseModel):
    label: str
    provider: str
    last4: str | None = None
    is_default: bool = False

    @field_validator("label", "provider")
    @classmethod
    def validate_text_fields(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Value must be at least 2 characters.")
        return normalized

    @field_validator("last4")
    @classmethod
    def validate_last4(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if len(normalized) != 4 or not normalized.isdigit():
            raise ValueError("last4 must contain exactly 4 digits.")
        return normalized


class PaymentMethodUpdate(BaseModel):
    label: str | None = None
    provider: str | None = None
    last4: str | None = None
    is_default: bool | None = None

    @field_validator("label", "provider")
    @classmethod
    def validate_text_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Value must be at least 2 characters.")
        return normalized

    @field_validator("last4")
    @classmethod
    def validate_last4(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if normalized and (len(normalized) != 4 or not normalized.isdigit()):
            raise ValueError("last4 must contain exactly 4 digits.")
        return normalized or None


class PaymentMethodResponse(BaseModel):
    id: int
    user_id: int | None
    label: str
    provider: str
    last4: str | None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentMethodListResponse(BaseModel):
    items: list[PaymentMethodResponse]
    total: int
