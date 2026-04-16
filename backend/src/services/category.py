import re

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logging import get_logger
from src.models.category import Category
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.category import CategoryCreate, CategoryUpdate

logger = get_logger(__name__)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "category"


async def _get_duplicate_category(
    session: AsyncSession,
    *,
    user_id: int,
    name: str,
    exclude_id: int | None = None,
) -> Category | None:
    statement = select(Category).where(
        Category.user_id == user_id,
        func.lower(Category.name) == name.lower(),
    )
    if exclude_id is not None:
        statement = statement.where(Category.id != exclude_id)
    return await session.scalar(statement)


async def list_categories(session: AsyncSession, user: User) -> tuple[list[Category], int]:
    statement = select(Category).where(Category.user_id == user.id).order_by(Category.id.asc())
    items = list((await session.scalars(statement)).all())
    total = await session.scalar(
        select(func.count()).select_from(Category).where(Category.user_id == user.id)
    )
    logger.info("categories.listed", user_id=user.id, total=total)
    return items, int(total or 0)


async def get_category_or_404(
    session: AsyncSession,
    category_id: int,
    user: User,
) -> Category:
    statement = select(Category).where(Category.id == category_id, Category.user_id == user.id)
    category = await session.scalar(statement)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return category


async def create_category(session: AsyncSession, user: User, payload: CategoryCreate) -> Category:
    duplicate = await _get_duplicate_category(session, user_id=user.id, name=payload.name)
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with that name already exists.",
        )

    category = Category(
        user_id=user.id,
        name=payload.name,
        slug=_slugify(payload.name),
        description=payload.description,
    )
    session.add(category)
    await session.commit()
    await session.refresh(category)
    logger.info(
        "categories.created",
        user_id=user.id,
        category_id=category.id,
        slug=category.slug,
    )
    return category


async def update_category(
    session: AsyncSession,
    category_id: int,
    user: User,
    payload: CategoryUpdate,
) -> Category:
    category = await get_category_or_404(session, category_id, user)

    changes = payload.model_dump(exclude_unset=True)
    if "name" in changes and changes["name"] is not None:
        duplicate = await _get_duplicate_category(
            session,
            user_id=user.id,
            name=changes["name"],
            exclude_id=category.id,
        )
        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A category with that name already exists.",
            )
        category.name = changes["name"]
        category.slug = _slugify(changes["name"])

    if "description" in changes:
        category.description = changes["description"]

    await session.commit()
    await session.refresh(category)
    logger.info("categories.updated", user_id=user.id, category_id=category.id)
    return category


async def delete_category(session: AsyncSession, category_id: int, user: User) -> None:
    category = await get_category_or_404(session, category_id, user)
    await session.execute(
        update(Subscription).where(Subscription.category_id == category.id).values(category_id=None)
    )
    await session.delete(category)
    await session.commit()
    logger.info("categories.deleted", user_id=user.id, category_id=category_id)
