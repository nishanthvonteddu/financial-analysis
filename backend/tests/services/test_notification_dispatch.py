import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from src.core import database as database_module
from src.models.notification import Notification
from src.models.sent_notification import SentNotification
from src.models.subscription import Subscription
from src.models.user import User
from src.services.notification import dispatch_renewal_notifications


class FakeEmailService:
    def __init__(self) -> None:
        self.messages: list[dict[str, str]] = []

    async def send(self, *, to_email: str, subject: str, body: str) -> None:
        self.messages.append({"body": body, "subject": subject, "to_email": to_email})


def test_dispatch_renewal_notifications_creates_in_app_and_email_once(app) -> None:
    async def exercise() -> tuple[int, int, int, int]:
        async with database_module.SessionLocal() as session:
            user = User(
                email="renewals@example.com",
                full_name="Renewal Owner",
                hashed_password="hashed",
            )
            session.add(user)
            await session.flush()
            session.add(
                Subscription(
                    user_id=user.id,
                    name="Netflix",
                    vendor="Netflix",
                    amount=Decimal("15.99"),
                    currency="USD",
                    cadence="monthly",
                    status="active",
                    start_date=date(2026, 4, 1),
                    next_charge_date=date(2026, 4, 24),
                    auto_renew=True,
                )
            )
            await session.commit()

        email_service = FakeEmailService()
        async with database_module.SessionLocal() as session:
            first_summary = await dispatch_renewal_notifications(
                session,
                as_of=date(2026, 4, 22),
                email_service=email_service,
            )
            second_summary = await dispatch_renewal_notifications(
                session,
                as_of=date(2026, 4, 22),
                email_service=email_service,
            )

        async with database_module.SessionLocal() as session:
            notifications = list((await session.scalars(select(Notification))).all())
            sent = list((await session.scalars(select(SentNotification))).all())

        assert first_summary.in_app_created == 1
        assert first_summary.email_sent == 1
        assert second_summary.in_app_created == 0
        assert second_summary.email_sent == 0
        assert len(email_service.messages) == 1
        return (
            len(notifications),
            len(sent),
            first_summary.skipped_duplicates,
            second_summary.skipped_duplicates,
        )

    notification_count, sent_count, first_skipped, second_skipped = asyncio.run(exercise())
    assert notification_count == 1
    assert sent_count == 2
    assert first_skipped == 0
    assert second_skipped == 2
