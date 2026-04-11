import asyncio
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from src.core import database as database_module
from src.models.payment_history import PaymentHistory
from src.models.subscription import Subscription


def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Dashboard Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_category(client, headers: dict[str, str], name: str) -> int:
    response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": name, "description": f"{name} services"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_payment_method(client, headers: dict[str, str]) -> int:
    response = client.post(
        "/api/v1/payment-methods",
        headers=headers,
        json={"label": "Primary card", "provider": "Visa", "last4": "4242", "is_default": True},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_subscription(
    client,
    headers: dict[str, str],
    *,
    name: str,
    amount: str,
    cadence: str,
    status: str,
    start_date: str,
    category_id: int | None = None,
    next_charge_date: str | None = None,
    end_date: str | None = None,
    payment_method_id: int | None = None,
) -> int:
    response = client.post(
        "/api/v1/subscriptions",
        headers=headers,
        json={
            "name": name,
            "vendor": name,
            "amount": amount,
            "currency": "USD",
            "cadence": cadence,
            "status": status,
            "start_date": start_date,
            "category_id": category_id,
            "next_charge_date": next_charge_date,
            "end_date": end_date,
            "payment_method_id": payment_method_id,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _seed_payment_history(subscription_id: int, paid_at: datetime, amount: Decimal) -> None:
    async def _write() -> None:
        async with database_module.SessionLocal() as session:
            subscription = await session.get(Subscription, subscription_id)
            assert subscription is not None
            session.add(
                PaymentHistory(
                    subscription_id=subscription.id,
                    payment_method_id=subscription.payment_method_id,
                    paid_at=paid_at,
                    amount=amount,
                    currency="USD",
                    payment_status="settled",
                    reference=f"{subscription_id}-{paid_at.date().isoformat()}",
                )
            )
            await session.commit()

    asyncio.run(_write())


def test_dashboard_summary_and_layout_persistence(client) -> None:
    today = date.today()
    current_month_start = today.replace(day=1)
    previous_month = (current_month_start - timedelta(days=1)).replace(day=1)

    owner_headers = _auth_headers(client, "owner@example.com")
    other_headers = _auth_headers(client, "other@example.com")
    entertainment_id = _create_category(client, owner_headers, "Entertainment")
    productivity_id = _create_category(client, owner_headers, "Productivity")
    payment_method_id = _create_payment_method(client, owner_headers)

    netflix_id = _create_subscription(
        client,
        owner_headers,
        name="Netflix",
        amount="15.00",
        cadence="monthly",
        status="active",
        start_date=str(today - timedelta(days=120)),
        category_id=entertainment_id,
        next_charge_date=str(today + timedelta(days=4)),
        payment_method_id=payment_method_id,
    )
    dropbox_id = _create_subscription(
        client,
        owner_headers,
        name="Dropbox",
        amount="120.00",
        cadence="yearly",
        status="active",
        start_date=str(today - timedelta(days=300)),
        category_id=productivity_id,
        next_charge_date=str(today + timedelta(days=12)),
        payment_method_id=payment_method_id,
    )
    _create_subscription(
        client,
        owner_headers,
        name="Gym",
        amount="45.00",
        cadence="monthly",
        status="cancelled",
        start_date=str(today - timedelta(days=200)),
        end_date=str(today - timedelta(days=3)),
        payment_method_id=payment_method_id,
    )
    _create_subscription(
        client,
        other_headers,
        name="Other Service",
        amount="99.00",
        cadence="monthly",
        status="active",
        start_date=str(today - timedelta(days=10)),
    )

    _seed_payment_history(
        netflix_id,
        datetime.combine(
            current_month_start + timedelta(days=2),
            datetime.min.time(),
            tzinfo=UTC,
        ),
        Decimal("15.00"),
    )
    _seed_payment_history(
        dropbox_id,
        datetime.combine(
            current_month_start + timedelta(days=4),
            datetime.min.time(),
            tzinfo=UTC,
        ),
        Decimal("120.00"),
    )
    _seed_payment_history(
        netflix_id,
        datetime.combine(
            previous_month + timedelta(days=8),
            datetime.min.time(),
            tzinfo=UTC,
        ),
        Decimal("15.00"),
    )

    summary_response = client.get("/api/v1/dashboard/summary", headers=owner_headers)

    assert summary_response.status_code == 200
    payload = summary_response.json()
    assert payload["summary"] == {
        "total_monthly_spend": "25.00",
        "active_subscriptions": 2,
        "upcoming_renewals": 2,
        "cancelled_subscriptions": 1,
    }
    assert payload["category_breakdown"][0]["category_name"] == "Entertainment"
    assert payload["category_breakdown"][0]["total_monthly_spend"] == "15.00"
    assert payload["category_breakdown"][1]["category_name"] == "Productivity"
    assert payload["upcoming_renewals"][0]["name"] == "Netflix"
    assert payload["upcoming_renewals"][0]["days_until_charge"] == 4
    assert payload["upcoming_renewals"][1]["name"] == "Dropbox"
    assert payload["recently_ended"][0]["name"] == "Gym"

    month_map = {item["month"]: item["total"] for item in payload["monthly_spend"]}
    assert month_map[current_month_start.strftime("%Y-%m")] == "135.00"
    assert month_map[previous_month.strftime("%Y-%m")] == "15.00"

    layout_response = client.get("/api/v1/dashboard/layout", headers=owner_headers)
    assert layout_response.status_code == 200
    assert layout_response.json()["widgets"] == [
        {"id": "monthly-spend", "column": "primary"},
        {"id": "category-breakdown", "column": "primary"},
        {"id": "upcoming-renewals", "column": "secondary"},
        {"id": "recently-ended", "column": "secondary"},
    ]

    update_response = client.put(
        "/api/v1/dashboard/layout",
        headers=owner_headers,
        json={
            "widgets": [
                {"id": "upcoming-renewals", "column": "primary"},
                {"id": "monthly-spend", "column": "primary"},
                {"id": "category-breakdown", "column": "secondary"},
                {"id": "recently-ended", "column": "secondary"},
            ]
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["version"] == 1
    assert update_response.json()["widgets"][0]["id"] == "upcoming-renewals"

    persisted_layout_response = client.get("/api/v1/dashboard/layout", headers=owner_headers)
    assert persisted_layout_response.status_code == 200
    assert persisted_layout_response.json()["widgets"][0] == {
        "id": "upcoming-renewals",
        "column": "primary",
    }

    other_layout_response = client.get("/api/v1/dashboard/layout", headers=other_headers)
    assert other_layout_response.status_code == 200
    assert other_layout_response.json()["widgets"][0]["id"] == "monthly-spend"


def test_dashboard_layout_requires_each_widget_exactly_once(client) -> None:
    headers = _auth_headers(client, "layout-owner@example.com")

    response = client.put(
        "/api/v1/dashboard/layout",
        headers=headers,
        json={
            "widgets": [
                {"id": "monthly-spend", "column": "primary"},
                {"id": "monthly-spend", "column": "secondary"},
                {"id": "upcoming-renewals", "column": "secondary"},
                {"id": "recently-ended", "column": "primary"},
            ]
        },
    )

    assert response.status_code == 422
