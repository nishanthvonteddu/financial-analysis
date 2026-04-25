import asyncio
import csv
import io
import json
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
            "full_name": "Export Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create_category(client, headers: dict[str, str], name: str = "Streaming") -> int:
    response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": name, "description": f"{name} exports"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_payment_method(client, headers: dict[str, str], label: str = "Primary Card") -> int:
    response = client.post(
        "/api/v1/payment-methods",
        headers=headers,
        json={"label": label, "provider": "Visa", "last4": "4242", "is_default": True},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_subscription(
    client,
    headers: dict[str, str],
    *,
    name: str,
    amount: str,
    next_charge_date: str,
    category_id: int | None = None,
    payment_method_id: int | None = None,
    status: str = "active",
    auto_renew: bool = True,
) -> int:
    response = client.post(
        "/api/v1/subscriptions",
        headers=headers,
        json={
            "name": name,
            "vendor": name,
            "amount": amount,
            "currency": "USD",
            "cadence": "monthly",
            "status": status,
            "start_date": "2026-01-01",
            "next_charge_date": next_charge_date,
            "category_id": category_id,
            "payment_method_id": payment_method_id,
            "auto_renew": auto_renew,
            "notes": f"{name} export note",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _seed_payment_history(subscription_id: int) -> None:
    async def _write() -> None:
        async with database_module.SessionLocal() as session:
            subscription = await session.get(Subscription, subscription_id)
            assert subscription is not None
            session.add_all(
                [
                    PaymentHistory(
                        subscription_id=subscription.id,
                        payment_method_id=subscription.payment_method_id,
                        paid_at=datetime(2026, 3, 1, 12, tzinfo=UTC),
                        amount=Decimal("15.00"),
                        currency="USD",
                        payment_status="settled",
                        reference="march-renewal",
                    ),
                    PaymentHistory(
                        subscription_id=subscription.id,
                        payment_method_id=subscription.payment_method_id,
                        paid_at=datetime(2026, 4, 1, 12, tzinfo=UTC),
                        amount=Decimal("17.00"),
                        currency="USD",
                        payment_status="settled",
                        reference="april-renewal",
                    ),
                ]
            )
            await session.commit()

    asyncio.run(_write())


def test_export_csv_json_and_ownership_filtering(client) -> None:
    owner_headers = _auth_headers(client, "export-owner@example.com")
    other_headers = _auth_headers(client, "export-other@example.com")
    category_id = _create_category(client, owner_headers)
    payment_method_id = _create_payment_method(client, owner_headers)
    today = date.today()

    netflix_id = _create_subscription(
        client,
        owner_headers,
        name="Netflix",
        amount="17.00",
        next_charge_date=str(today + timedelta(days=7)),
        category_id=category_id,
        payment_method_id=payment_method_id,
    )
    _seed_payment_history(netflix_id)
    _create_subscription(
        client,
        owner_headers,
        name="Paused Tool",
        amount="9.00",
        next_charge_date=str(today + timedelta(days=9)),
        status="paused",
    )
    _create_subscription(
        client,
        other_headers,
        name="Other Account Plan",
        amount="99.00",
        next_charge_date=str(today + timedelta(days=11)),
    )

    csv_response = client.get(
        "/api/v1/exports",
        headers=owner_headers,
        params={"format": "csv", "active_only": "true", "include_payment_history": "true"},
    )

    assert csv_response.status_code == 200
    assert csv_response.headers["content-type"].startswith("text/csv")
    assert "attachment;" in csv_response.headers["content-disposition"]
    assert ".csv" in csv_response.headers["content-disposition"]
    rows = list(csv.DictReader(io.StringIO(csv_response.text)))
    assert len(rows) == 1
    assert rows[0]["name"] == "Netflix"
    assert rows[0]["category"] == "Streaming"
    assert rows[0]["payment_method"] == "Primary Card"
    assert rows[0]["payment_count"] == "2"
    assert rows[0]["total_paid"] == "32.00"

    json_response = client.get(
        "/api/v1/exports",
        headers=owner_headers,
        params={"format": "json", "active_only": "false", "include_payment_history": "true"},
    )

    assert json_response.status_code == 200
    assert json_response.headers["content-type"].startswith("application/json")
    assert ".json" in json_response.headers["content-disposition"]
    payload = json.loads(json_response.text)
    assert payload["metadata"]["subscription_count"] == 2
    subscriptions_by_name = {item["name"]: item for item in payload["subscriptions"]}
    assert sorted(subscriptions_by_name) == ["Netflix", "Paused Tool"]
    assert len(subscriptions_by_name["Netflix"]["payment_history"]) == 2
    assert subscriptions_by_name["Netflix"]["payment_history"][0]["reference"] == "april-renewal"


def test_export_ics_contains_projected_renewal_events(client) -> None:
    headers = _auth_headers(client, "export-calendar@example.com")
    today = date.today()

    _create_subscription(
        client,
        headers,
        name="Music Plan",
        amount="12.00",
        next_charge_date=str(today + timedelta(days=3)),
    )
    _create_subscription(
        client,
        headers,
        name="Manual Plan",
        amount="22.00",
        next_charge_date=str(today + timedelta(days=4)),
        auto_renew=False,
    )

    response = client.get(
        "/api/v1/exports",
        headers=headers,
        params={"format": "ics", "calendar_months": "1"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/calendar")
    assert ".ics" in response.headers["content-disposition"]
    assert "BEGIN:VCALENDAR" in response.text
    assert "SUMMARY:Music Plan renewal" in response.text
    assert "Manual Plan renewal" not in response.text


def test_export_rejects_unsupported_format(client) -> None:
    headers = _auth_headers(client, "export-invalid@example.com")

    response = client.get(
        "/api/v1/exports",
        headers=headers,
        params={"format": "xlsx"},
    )

    assert response.status_code == 422
