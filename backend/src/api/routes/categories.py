from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.category import (
    CategoryCreate,
    CategoryListResponse,
    CategoryResponse,
    CategoryUpdate,
)
from src.services.category import (
    create_category,
    delete_category,
    get_category_or_404,
    list_categories,
    update_category,
)

router = APIRouter(prefix="/categories", tags=["categories"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "",
    response_model=CategoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="List categories",
)
async def get_categories(
    session: DbSession,
    current_user: CurrentUser,
) -> CategoryListResponse:
    items, total = await list_categories(session, current_user)
    return CategoryListResponse(
        items=[CategoryResponse.model_validate(item) for item in items],
        total=total,
    )


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a category",
)
async def create_category_route(
    payload: CategoryCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> CategoryResponse:
    category = await create_category(session, current_user, payload)
    return CategoryResponse.model_validate(category)


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a category",
)
async def get_category(
    category_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> CategoryResponse:
    category = await get_category_or_404(session, category_id, current_user)
    return CategoryResponse.model_validate(category)


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a category",
)
async def update_category_route(
    category_id: int,
    payload: CategoryUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> CategoryResponse:
    category = await update_category(session, category_id, current_user, payload)
    return CategoryResponse.model_validate(category)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a category",
)
async def delete_category_route(
    category_id: int,
    session: DbSession,
    current_user: CurrentUser,
) -> Response:
    await delete_category(session, category_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
