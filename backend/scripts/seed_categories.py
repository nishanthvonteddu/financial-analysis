import asyncio

from sqlalchemy import select

from src.core.database import SessionLocal
from src.models.category import Category

CATEGORIES = [
    ("streaming", "Streaming services"),
    ("productivity", "Productivity tools"),
    ("music", "Music and audio"),
    ("gaming", "Gaming platforms"),
    ("cloud", "Cloud infrastructure"),
    ("finance", "Personal finance"),
    ("fitness", "Fitness and wellness"),
    ("education", "Education and learning"),
    ("news", "News and publications"),
    ("shopping", "Retail memberships"),
    ("food", "Food delivery"),
    ("travel", "Travel subscriptions"),
    ("utilities", "Household utilities"),
    ("security", "Security and privacy"),
    ("other", "Miscellaneous"),
]


async def seed_categories() -> None:
    async with SessionLocal() as session:
        existing = await session.execute(select(Category.slug))
        known = set(existing.scalars())
        for slug, description in CATEGORIES:
            if slug in known:
                continue
            session.add(
                Category(
                    name=slug.replace("-", " ").title(),
                    slug=slug,
                    description=description,
                )
            )
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_categories())
