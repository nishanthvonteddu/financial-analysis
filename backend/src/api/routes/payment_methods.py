from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodListResponse,
    PaymentMethodResponse,
    PaymentMethodUpdate,
)
from src.services.payment_method import (
    create_payment_method,
    delete_payment_method,
    get_payment_method_or_404,
    list_payment_methods,
    update_payment_method,
)

router = APIRouter(prefix="/payment-methods", tags=["payment-methods"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=PaymentMethodListResponse, status_code=status.HTTP_200_OK)
async def get_payment_methods(
    session: DbSession,
    current_user: CurrentUser,
) -> PaymentMethodListResponse:
    items, total = await list_payment_methods(session, current_user)
    return PaymentMethodListResponse(
        items=[PaymentMethodResponse.model_validate(item) for item in items],
        total=total,
    )


@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_method_route(
    payload: PaymentMethodCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> PaymentMethodResponse:
    payment_method = await create_payment_method(session, current_user, payload)
    return PaymentMethodResponse.model_validate(payment_method)


@router.get(
    "/{payment_method_id}",
    response_model=PaymentMethodResponse,
    status_code=status.HTTP_200_OK,
)
async def get_payment_method(
    payment_method_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> PaymentMethodResponse:
    payment_method = await get_payment_method_or_404(session, payment_method_id, current_user)
    return PaymentMethodResponse.model_validate(payment_method)


@router.patch(
    "/{payment_method_id}",
    response_model=PaymentMethodResponse,
    status_code=status.HTTP_200_OK,
)
async def update_payment_method_route(
    payment_method_id: int,
    payload: PaymentMethodUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> PaymentMethodResponse:
    payment_method = await update_payment_method(
        session,
        payment_method_id,
        current_user,
        payload,
    )
    return PaymentMethodResponse.model_validate(payment_method)


@router.delete("/{payment_method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method_route(
    payment_method_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> Response:
    await delete_payment_method(session, payment_method_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
