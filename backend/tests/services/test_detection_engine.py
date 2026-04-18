import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from src.core import database as database_module
from src.models.category import Category
from src.models.payment_history import PaymentHistory
from src.models.raw_transaction import RawTransaction
from src.models.subscription import Subscription
from src.models.subscription_event import SubscriptionEvent
from src.models.user import User
from src.services.detection_engine import (
    detect_subscriptions,
    determine_subscription_status,
    sync_user_subscriptions,
)


def test_determine_subscription_status_transitions_from_active_to_cancelled() -> None:
    active_status, active_next_charge = determine_subscription_status(
        last_charge_date=date(2026, 3, 1),
        interval_days=30,
        as_of=date(2026, 4, 10),
    )
    paused_status, _ = determine_subscription_status(
        last_charge_date=date(2026, 3, 1),
        interval_days=30,
        as_of=date(2026, 5, 5),
    )
    cancelled_status, _ = determine_subscription_status(
        last_charge_date=date(2026, 3, 1),
        interval_days=30,
        as_of=date(2026, 6, 20),
    )

    assert active_status == "active"
    assert active_next_charge == date(2026, 3, 31)
    assert paused_status == "paused"
    assert cancelled_status == "cancelled"


def test_detect_subscriptions_filters_low_confidence_groups() -> None:
    detections = detect_subscriptions(
        [
            RawTransaction(
                posted_at=date(2026, 1, 1),
                merchant="Neighborhood Cafe",
                description="Neighborhood Cafe",
                amount=Decimal("-8.00"),
                currency="USD",
                transaction_type="debit",
                raw_payload={},
            ),
            RawTransaction(
                posted_at=date(2026, 2, 1),
                merchant="Neighborhood Cafe",
                description="Neighborhood Cafe",
                amount=Decimal("-18.00"),
                currency="USD",
                transaction_type="debit",
                raw_payload={},
            ),
        ],
        as_of=date(2026, 2, 15),
    )

    assert detections == []


def test_sync_user_subscriptions_creates_detected_subscriptions_and_payment_history(app) -> None:
    async def exercise() -> None:
        async with database_module.SessionLocal() as session:
            user = User(
                email="detector@example.com",
                full_name="Detector",
                hashed_password="hashed",
            )
            session.add(user)
            await session.flush()

            session.add_all(
                [
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-1",
                        posted_at=date(2026, 1, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.49"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True, "service_category": "entertainment"},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-2",
                        posted_at=date(2026, 2, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.49"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True, "service_category": "entertainment"},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-3",
                        posted_at=date(2026, 3, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.49"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True, "service_category": "entertainment"},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="gym-1",
                        posted_at=date(2026, 1, 5),
                        merchant="Local Gym",
                        description="LOCAL GYM MEMBERSHIP",
                        amount=Decimal("-39.99"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=False,
                        raw_payload={},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="gym-2",
                        posted_at=date(2026, 2, 5),
                        merchant="Local Gym",
                        description="LOCAL GYM MEMBERSHIP",
                        amount=Decimal("-39.99"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=False,
                        raw_payload={},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="gym-3",
                        posted_at=date(2026, 3, 6),
                        merchant="Local Gym",
                        description="LOCAL GYM MEMBERSHIP",
                        amount=Decimal("-39.99"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=False,
                        raw_payload={},
                    ),
                ]
            )
            await session.commit()

        detections = await sync_user_subscriptions(user_id=1, as_of=date(2026, 4, 10))
        assert {detection.vendor for detection in detections} == {"Local Gym", "Netflix"}

        async with database_module.SessionLocal() as session:
            subscriptions = list(
                (
                    await session.scalars(
                        select(Subscription)
                        .where(Subscription.user_id == 1)
                        .order_by(Subscription.vendor.asc())
                    )
                ).all()
            )
            categories = list((await session.scalars(select(Category))).all())
            payment_history = list((await session.scalars(select(PaymentHistory))).all())

        assert len(subscriptions) == 2
        assert {subscription.vendor for subscription in subscriptions} == {"Local Gym", "Netflix"}
        assert len(payment_history) == 6
        assert len(categories) == 1
        assert categories[0].user_id == 1
        assert categories[0].slug == "entertainment"

        netflix = next(
            subscription for subscription in subscriptions if subscription.vendor == "Netflix"
        )
        gym = next(
            subscription for subscription in subscriptions if subscription.vendor == "Local Gym"
        )

        assert netflix.cadence == "monthly"
        assert netflix.status == "active"
        assert netflix.category_id == categories[0].id
        assert netflix.next_charge_date == date(2026, 3, 31)
        assert gym.cadence == "monthly"
        assert gym.status == "active"
        assert gym.category_id is None

    asyncio.run(exercise())


def test_sync_user_subscriptions_records_price_change_events(app) -> None:
    async def exercise() -> None:
        async with database_module.SessionLocal() as session:
            user = User(
                email="price-change@example.com",
                full_name="Price Change Owner",
                hashed_password="hashed",
            )
            session.add(user)
            await session.flush()

            session.add_all(
                [
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-1",
                        posted_at=date(2026, 1, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.00"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True, "service_category": "entertainment"},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-2",
                        posted_at=date(2026, 2, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.00"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True, "service_category": "entertainment"},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-3",
                        posted_at=date(2026, 3, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-18.00"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True, "service_category": "entertainment"},
                    ),
                ]
            )
            await session.commit()

        await sync_user_subscriptions(user_id=1, as_of=date(2026, 4, 10))

        async with database_module.SessionLocal() as session:
            subscription = await session.scalar(
                select(Subscription).where(Subscription.user_id == 1)
            )
            assert subscription is not None
            events = list((await session.scalars(select(SubscriptionEvent))).all())

        assert subscription.amount == Decimal("18.00")
        assert len(events) == 1
        assert events[0].event_type == "price_changed"
        assert events[0].payload["previous_amount"] == "15.00"
        assert events[0].payload["new_amount"] == "18.00"

    asyncio.run(exercise())


def test_sync_user_subscriptions_reactivates_existing_subscription_after_matching_charge(
    app,
) -> None:
    async def exercise() -> None:
        async with database_module.SessionLocal() as session:
            user = User(
                email="renewal-reactivation@example.com",
                full_name="Renewal Reactivation Owner",
                hashed_password="hashed",
            )
            session.add(user)
            await session.flush()

            subscription = Subscription(
                user_id=user.id,
                category_id=None,
                payment_method_id=None,
                name="Netflix",
                vendor="Netflix",
                description="Imported earlier",
                website_url=None,
                amount=Decimal("15.49"),
                currency="USD",
                cadence="monthly",
                status="paused",
                start_date=date(2026, 1, 1),
                end_date=date(2026, 3, 31),
                next_charge_date=date(2026, 3, 31),
                day_of_month=1,
                auto_renew=True,
                notes="Waiting for the next renewal event.",
            )
            session.add(subscription)
            await session.flush()

            session.add_all(
                [
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-1",
                        posted_at=date(2026, 1, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.49"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-2",
                        posted_at=date(2026, 2, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.49"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-3",
                        posted_at=date(2026, 3, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.49"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True},
                    ),
                    RawTransaction(
                        user_id=user.id,
                        data_source_id=None,
                        external_id="nf-4",
                        posted_at=date(2026, 4, 1),
                        merchant="Netflix",
                        description="NETFLIX COM LOS GATOS",
                        amount=Decimal("-15.49"),
                        currency="USD",
                        transaction_type="debit",
                        subscription_candidate=True,
                        raw_payload={"is_known_service": True},
                    ),
                ]
            )
            await session.commit()

        await sync_user_subscriptions(user_id=1, as_of=date(2026, 4, 2))

        async with database_module.SessionLocal() as session:
            refreshed_subscription = await session.scalar(
                select(Subscription).where(Subscription.user_id == 1)
            )
            payment_history = list(
                (
                    await session.scalars(
                        select(PaymentHistory)
                        .where(PaymentHistory.subscription_id == refreshed_subscription.id)
                        .order_by(PaymentHistory.paid_at.asc())
                    )
                ).all()
            )

        assert refreshed_subscription is not None
        assert refreshed_subscription.status == "active"
        assert refreshed_subscription.end_date is None
        assert refreshed_subscription.next_charge_date == date(2026, 5, 1)
        assert len(payment_history) == 4
        assert payment_history[-1].paid_at.date() == date(2026, 4, 1)

    asyncio.run(exercise())
