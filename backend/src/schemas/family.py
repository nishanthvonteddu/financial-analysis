from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FamilyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()


class FamilyJoinRequest(BaseModel):
    invite_code: str = Field(min_length=6, max_length=32)

    @field_validator("invite_code")
    @classmethod
    def normalize_invite_code(cls, value: str) -> str:
        return value.strip()


class FamilyPrivacyUpdate(BaseModel):
    share_subscriptions: bool


class FamilyMemberResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    role: str
    share_subscriptions: bool
    joined_at: datetime
    is_current_user: bool


class FamilyResponse(BaseModel):
    id: int
    name: str
    owner_user_id: int
    invite_code: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FamilyStatusResponse(BaseModel):
    family: FamilyResponse | None
    members: list[FamilyMemberResponse]
    current_member: FamilyMemberResponse | None


class FamilyDashboardSummary(BaseModel):
    family_name: str
    member_count: int
    sharing_member_count: int
    visible_active_subscriptions: int
    visible_monthly_spend: Decimal
    currency: str


class FamilyDashboardMemberSpend(BaseModel):
    user_id: int
    full_name: str
    visible: bool
    active_subscriptions: int
    monthly_spend: Decimal
    currency: str


class FamilySharedPlanRecommendation(BaseModel):
    vendor: str
    subscription_count: int
    member_names: list[str]
    estimated_monthly_savings: Decimal
    currency: str
    reason: str


class FamilyDashboardResponse(BaseModel):
    summary: FamilyDashboardSummary
    member_spend: list[FamilyDashboardMemberSpend]
    recommendations: list[FamilySharedPlanRecommendation]
