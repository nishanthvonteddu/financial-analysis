import asyncio
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from src.core import database as database_module
from src.models.exchange_rate import ExchangeRate
from src.models.payment_history import PaymentHistory
from src.models.subscription import Subscription


def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Analytics Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create_category(client, headers: dict[str, str], name: str) -> int:
    response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": name, "description": f"{name} category"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_payment_method(
    client,
    headers: dict[str, str],
    *,
    label: str,
    provider: str,
    last4: str,
) -> int:
    response = client.post(
        "/api/v1/payment-methods",
        headers=headers,
        json={
            "label": label,
            "provider": provider,
            "last4": last4,
            "is_default": False,
        },
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
    category_id: int,
    payment_method_id: int,
    start_date: str,
    currency: str = "USD",
) -> int:
    response = client.post(
        "/api/v1/subscriptions",
        headers=headers,
        json={
            "name": name,
            "vendor": name,
            "amount": amount,
            "currency": currency,
            "cadence": cadence,
            "status": "active",
            "start_date": start_date,
            "category_id": category_id,
            "payment_method_id": payment_method_id,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _seed_payment_history(
    subscription_id: int,
    paid_at: datetime,
    amount: Decimal,
    *,
    currency: str = "USD",
) -> None:
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
                    currency=currency,
                    payment_status="settled",
                    reference=f"{subscription_id}-{paid_at.date().isoformat()}",
                )
            )
            await session.commit()

    asyncio.run(_write())


def _seed_exchange_rate(base: str, quote: str, rate: str, effective_date: date) -> None:
    async def _write() -> None:
        async with database_module.SessionLocal() as session:
            session.add(
                ExchangeRate(
                    base_currency=base,
                    quote_currency=quote,
                    rate=Decimal(rate),
                    effective_date=effective_date,
                    source="test",
                )
            )
            await session.commit()

    asyncio.run(_write())


def test_expense_analytics_returns_category_method_frequency_and_trend_data(client) -> None:
    today = date.today()
    current_month_start = today.replace(day=1)
    previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    two_months_back = (previous_month_start - timedelta(days=1)).replace(day=1)

    headers = _auth_headers(client, "analytics@example.com")
    other_headers = _auth_headers(client, "other-analytics@example.com")

    entertainment_id = _create_category(client, headers, "Entertainment")
    utilities_id = _create_category(client, headers, "Utilities")
    productivity_id = _create_category(client, headers, "Productivity")

    visa_id = _create_payment_method(
        client,
        headers,
        label="Primary card",
        provider="Visa",
        last4="4242",
    )
    amex_id = _create_payment_method(
        client,
        headers,
        label="Backup card",
        provider="Amex",
        last4="3005",
    )

    netflix_id = _create_subscription(
        client,
        headers,
        name="Netflix",
        amount="15.00",
        cadence="monthly",
        category_id=entertainment_id,
        payment_method_id=visa_id,
        start_date=str(today - timedelta(days=180)),
    )
    spotify_id = _create_subscription(
        client,
        headers,
        name="Spotify",
        amount="10.00",
        cadence="monthly",
        category_id=entertainment_id,
        payment_method_id=amex_id,
        start_date=str(today - timedelta(days=180)),
    )
    electric_id = _create_subscription(
        client,
        headers,
        name="Electric",
        amount="90.00",
        cadence="quarterly",
        category_id=utilities_id,
        payment_method_id=amex_id,
        start_date=str(today - timedelta(days=240)),
    )
    dropbox_id = _create_subscription(
        client,
        headers,
        name="Dropbox",
        amount="120.00",
        cadence="yearly",
        category_id=productivity_id,
        payment_method_id=visa_id,
        start_date=str(today - timedelta(days=400)),
    )

    _seed_payment_history(
        netflix_id,
        datetime.combine(current_month_start + timedelta(days=2), datetime.min.time(), tzinfo=UTC),
        Decimal("15.00"),
    )
    _seed_payment_history(
        spotify_id,
        datetime.combine(current_month_start + timedelta(days=4), datetime.min.time(), tzinfo=UTC),
        Decimal("10.00"),
    )
    _seed_payment_history(
        electric_id,
        datetime.combine(previous_month_start + timedelta(days=5), datetime.min.time(), tzinfo=UTC),
        Decimal("90.00"),
    )
    _seed_payment_history(
        netflix_id,
        datetime.combine(
            previous_month_start + timedelta(days=10),
            datetime.min.time(),
            tzinfo=UTC,
        ),
        Decimal("15.00"),
    )
    _seed_payment_history(
        dropbox_id,
        datetime.combine(two_months_back + timedelta(days=8), datetime.min.time(), tzinfo=UTC),
        Decimal("120.00"),
    )

    analytics_response = client.get("/api/v1/expense-reports/analytics?range=180d", headers=headers)

    assert analytics_response.status_code == 200
    payload = analytics_response.json()
    assert payload["window"]["key"] == "180d"
    assert payload["summary"] == {
        "total_spend": "250.00",
        "average_monthly_spend": "41.67",
        "currency": "USD",
        "active_subscriptions": 4,
        "projected_monthly_savings": "65.00",
        "projected_range_savings": "390.00",
    }
    assert payload["categories"][0] == {
        "category_id": utilities_id,
        "category_name": "Utilities",
        "total_spend": "90.00",
        "currency": "USD",
        "active_subscriptions": 1,
        "projected_monthly_savings": "30.00",
        "projected_range_savings": "180.00",
    }
    assert payload["categories"][1]["category_name"] == "Entertainment"
    assert payload["categories"][1]["total_spend"] == "40.00"
    assert payload["categories"][1]["projected_range_savings"] == "150.00"

    assert payload["payment_methods"][0]["payment_method_label"] == "Visa Primary card ending 4242"
    assert payload["payment_methods"][0]["total_spend"] == "150.00"
    assert payload["payment_methods"][1]["payment_method_label"] == "Amex Backup card ending 3005"
    assert payload["payment_methods"][1]["total_spend"] == "100.00"

    assert payload["frequency_distribution"] == [
        {
            "cadence": "monthly",
            "label": "Monthly cadence",
            "subscription_count": 2,
            "monthly_equivalent": "25.00",
            "currency": "USD",
        },
        {
            "cadence": "quarterly",
            "label": "Quarterly cadence",
            "subscription_count": 1,
            "monthly_equivalent": "30.00",
            "currency": "USD",
        },
        {
            "cadence": "yearly",
            "label": "Yearly cadence",
            "subscription_count": 1,
            "monthly_equivalent": "10.00",
            "currency": "USD",
        },
    ]

    trend_map = {item["period_start"]: item for item in payload["trends"]}
    assert trend_map[two_months_back.isoformat()]["total_spend"] == "120.00"
    assert trend_map[previous_month_start.isoformat()]["total_spend"] == "105.00"
    assert trend_map[current_month_start.isoformat()]["total_spend"] == "25.00"
    assert "Entertainment" in payload["trend_categories"]
    assert "Utilities" in payload["trend_categories"]

    other_response = client.get(
        "/api/v1/expense-reports/analytics?range=180d",
        headers=other_headers,
    )
    assert other_response.status_code == 200
    assert other_response.json()["summary"]["total_spend"] == "0.00"
    assert other_response.json()["categories"] == []


def test_expense_analytics_converts_observed_and_projected_totals(client) -> None:
    today = date.today()
    current_month_start = today.replace(day=1)
    headers = _auth_headers(client, "analytics-currency@example.com")
    category_id = _create_category(client, headers, "Infrastructure")
    method_id = _create_payment_method(
        client,
        headers,
        label="Primary card",
        provider="Visa",
        last4="4242",
    )
    _seed_exchange_rate("USD", "EUR", "0.900000", current_month_start)

    update_response = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"preferred_currency": "EUR"},
    )
    assert update_response.status_code == 200

    subscription_id = _create_subscription(
        client,
        headers,
        name="Cloud Storage",
        amount="10.00",
        cadence="monthly",
        category_id=category_id,
        payment_method_id=method_id,
        start_date=str(today - timedelta(days=120)),
    )
    _seed_payment_history(
        subscription_id,
        datetime.combine(current_month_start + timedelta(days=2), datetime.min.time(), tzinfo=UTC),
        Decimal("20.00"),
    )

    response = client.get("/api/v1/expense-reports/analytics?range=90d", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["currency"] == "EUR"
    assert payload["summary"]["total_spend"] == "18.00"
    assert payload["summary"]["projected_monthly_savings"] == "9.00"
    assert payload["categories"][0]["currency"] == "EUR"
    assert payload["categories"][0]["total_spend"] == "18.00"
