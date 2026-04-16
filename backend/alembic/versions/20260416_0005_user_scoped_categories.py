"""Convert categories to user-scoped records."""

import sqlalchemy as sa

from alembic import op

revision = "20260416_0005"
down_revision = "20260407_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True
        ),
    )
    op.drop_index("ix_categories_name", table_name="categories")
    op.drop_index("ix_categories_slug", table_name="categories")

    connection = op.get_bind()
    categories = sa.table(
        "categories",
        sa.column("id", sa.Integer()),
        sa.column("user_id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("slug", sa.String()),
        sa.column("description", sa.String()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    subscriptions = sa.table(
        "subscriptions",
        sa.column("category_id", sa.Integer()),
        sa.column("user_id", sa.Integer()),
    )

    category_rows = {
        row.id: row
        for row in connection.execute(
            sa.select(
                categories.c.id,
                categories.c.name,
                categories.c.slug,
                categories.c.description,
                categories.c.created_at,
                categories.c.updated_at,
            )
        )
    }
    category_users: dict[int, list[int]] = {}
    for row in connection.execute(
        sa.select(subscriptions.c.category_id, subscriptions.c.user_id)
        .where(subscriptions.c.category_id.is_not(None))
        .order_by(subscriptions.c.category_id.asc(), subscriptions.c.user_id.asc())
    ):
        if row.category_id is None:
            continue
        users = category_users.setdefault(row.category_id, [])
        if row.user_id not in users:
            users.append(row.user_id)

    for category_id, row in category_rows.items():
        users = category_users.get(category_id, [])
        if not users:
            connection.execute(sa.delete(categories).where(categories.c.id == category_id))
            continue

        connection.execute(
            sa.update(categories).where(categories.c.id == category_id).values(user_id=users[0])
        )

        for user_id in users[1:]:
            insert_result = connection.execute(
                sa.insert(categories).values(
                    user_id=user_id,
                    name=row.name,
                    slug=row.slug,
                    description=row.description,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                )
            )
            new_category_id = insert_result.inserted_primary_key[0]
            connection.execute(
                sa.update(subscriptions)
                .where(
                    subscriptions.c.category_id == category_id,
                    subscriptions.c.user_id == user_id,
                )
                .values(category_id=new_category_id)
            )

    connection.execute(sa.delete(categories).where(categories.c.user_id.is_(None)))
    op.alter_column("categories", "user_id", nullable=False)
    op.create_index("ix_categories_user_id_name", "categories", ["user_id", "name"], unique=True)
    op.create_index("ix_categories_user_id_slug", "categories", ["user_id", "slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_categories_user_id_slug", table_name="categories")
    op.drop_index("ix_categories_user_id_name", table_name="categories")
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)
    op.create_index("ix_categories_name", "categories", ["name"], unique=True)
    op.drop_column("categories", "user_id")
