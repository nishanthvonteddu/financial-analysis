from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

ScoreBand = Literal["excellent", "steady", "attention", "at-risk"]
RecommendationPriority = Literal["high", "medium", "low"]
DuplicateConfidence = Literal["high", "medium"]


class SubscriptionScoreBreakdownItem(BaseModel):
    id: Literal["coverage", "renewal", "context", "waste"]
    label: str
    detail: str
    score: int
    max_score: int


class SubscriptionScoreRecommendation(BaseModel):
    title: str
    description: str
    priority: RecommendationPriority
    action_label: str | None = None
    action_href: str | None = None
    subscriptions_affected: int | None = None
    potential_monthly_savings: Decimal | None = None
    currency: str | None = None


class SubscriptionDuplicateCandidate(BaseModel):
    left_subscription_id: int
    left_name: str
    left_vendor: str
    right_subscription_id: int
    right_name: str
    right_vendor: str
    shared_signal: str
    confidence: DuplicateConfidence
    potential_monthly_savings: Decimal
    currency: str


class SubscriptionScoreResponse(BaseModel):
    score: int
    grade: str
    band: ScoreBand
    active_subscription_count: int
    potential_monthly_savings: Decimal
    currency: str
    breakdown: list[SubscriptionScoreBreakdownItem]
    recommendations: list[SubscriptionScoreRecommendation]
    duplicate_candidates: list[SubscriptionDuplicateCandidate]
