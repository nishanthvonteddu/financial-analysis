from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionListResponse,
    SubscriptionResponse,
    SubscriptionUpdate,
)
from src.services.subscription import (
    create_subscription,
    delete_subscription,
    get_subscription_or_404,
    list_subscriptions,
    update_subscription,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
MinAmountQuery = Annotated[Decimal | None, Query()]
MaxAmountQuery = Annotated[Decimal | None, Query()]


@router.get("", response_model=SubscriptionListResponse, status_code=status.HTTP_200_OK)
async def get_subscriptions(
    session: DbSession,
    current_user: CurrentUser,
    status_filter: str | None = Query(default=None, alias="status"),
    category_id: int | None = Query(default=None),
    payment_method_id: int | None = Query(default=None),
    cadence: str | None = Query(default=None),
    min_amount: MinAmountQuery = None,
    max_amount: MaxAmountQuery = None,
    search: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
) -> SubscriptionListResponse:
    if min_amount is not None and max_amount is not None and min_amount > max_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="min_amount must be less than or equal to max_amount.",
        )

    items, total = await list_subscriptions(
        session,
        user=current_user,
        status_filter=status_filter,
        category_id=category_id,
        payment_method_id=payment_method_id,
        cadence=cadence,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search,
        offset=offset,
        limit=limit,
    )
    return SubscriptionListResponse(
        items=[SubscriptionResponse.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription_route(
    payload: SubscriptionCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> SubscriptionResponse:
    subscription = await create_subscription(session, user=current_user, payload=payload)
    return SubscriptionResponse.model_validate(subscription)


@router.get(
    "/{subscription_id}",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_200_OK,
)
async def get_subscription(
    subscription_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> SubscriptionResponse:
    subscription = await get_subscription_or_404(
        session,
        subscription_id=subscription_id,
        user=current_user,
    )
    return SubscriptionResponse.model_validate(subscription)


@router.patch(
    "/{subscription_id}",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_200_OK,
)
async def update_subscription_route(
    subscription_id: int,
    payload: SubscriptionUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> SubscriptionResponse:
    subscription = await update_subscription(
        session,
        subscription_id=subscription_id,
        user=current_user,
        payload=payload,
    )
    return SubscriptionResponse.model_validate(subscription)


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription_route(
    subscription_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> Response:
    await delete_subscription(session, subscription_id=subscription_id, user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
