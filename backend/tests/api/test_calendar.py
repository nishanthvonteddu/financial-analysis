from datetime import date


def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Calendar Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_category(client, headers: dict[str, str], name: str = "Streaming") -> int:
    response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": name, "description": f"{name} renewals"},
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
    cadence: str,
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
            "cadence": cadence,
            "status": status,
            "start_date": "2026-01-01",
            "next_charge_date": next_charge_date,
            "category_id": category_id,
            "payment_method_id": payment_method_id,
            "auto_renew": auto_renew,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_calendar_lists_projected_monthly_and_weekly_renewals(client) -> None:
    owner_headers = _auth_headers(client, "calendar-owner@example.com")
    other_headers = _auth_headers(client, "calendar-other@example.com")
    category_id = _create_category(client, owner_headers, "Entertainment")
    payment_method_id = _create_payment_method(client, owner_headers)

    monthly_id = _create_subscription(
        client,
        owner_headers,
        name="Netflix",
        amount="15.00",
        cadence="monthly",
        next_charge_date="2026-04-12",
        category_id=category_id,
        payment_method_id=payment_method_id,
    )
    weekly_id = _create_subscription(
        client,
        owner_headers,
        name="Meal Box",
        amount="5.00",
        cadence="weekly",
        next_charge_date="2026-04-03",
        category_id=category_id,
    )
    quarterly_id = _create_subscription(
        client,
        owner_headers,
        name="Quarterly Tool",
        amount="30.00",
        cadence="quarterly",
        next_charge_date="2026-05-28",
    )
    _create_subscription(
        client,
        owner_headers,
        name="Paused Plan",
        amount="12.00",
        cadence="monthly",
        next_charge_date="2026-05-10",
        status="paused",
    )
    _create_subscription(
        client,
        owner_headers,
        name="Manual Plan",
        amount="12.00",
        cadence="monthly",
        next_charge_date="2026-05-20",
        auto_renew=False,
    )
    _create_subscription(
        client,
        other_headers,
        name="Other Account",
        amount="99.00",
        cadence="monthly",
        next_charge_date="2026-05-12",
    )

    response = client.get(
        "/api/v1/calendar",
        headers=owner_headers,
        params={"year": 2026, "month": 5},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["year"] == 2026
    assert payload["month"] == 5
    assert payload["period_start"] == "2026-05-01"
    assert payload["period_end"] == "2026-05-31"
    assert payload["total_renewals"] == 7
    assert len(payload["days"]) == 31

    renewals_by_date = {
        day["date"]: day
        for day in payload["days"]
        if day["renewals"]
    }
    assert sorted(renewals_by_date) == [
        "2026-05-01",
        "2026-05-08",
        "2026-05-12",
        "2026-05-15",
        "2026-05-22",
        "2026-05-28",
        "2026-05-29",
    ]
    assert renewals_by_date["2026-05-12"]["total_amount"] == "15.00"
    assert renewals_by_date["2026-05-12"]["renewals"][0] == {
        "subscription_id": monthly_id,
        "name": "Netflix",
        "vendor": "Netflix",
        "amount": "15.00",
        "currency": "USD",
        "cadence": "monthly",
        "status": "active",
        "renewal_date": "2026-05-12",
        "category_id": category_id,
        "category_name": "Entertainment",
        "payment_method_id": payment_method_id,
        "payment_method_label": "Primary Card",
    }
    assert renewals_by_date["2026-05-01"]["renewals"][0]["subscription_id"] == weekly_id
    assert renewals_by_date["2026-05-28"]["renewals"][0]["subscription_id"] == quarterly_id


def test_calendar_defaults_to_current_month_and_validates_query(client) -> None:
    headers = _auth_headers(client, "calendar-default@example.com")
    today = date.today()

    response = client.get("/api/v1/calendar", headers=headers)

    assert response.status_code == 200
    assert response.json()["year"] == today.year
    assert response.json()["month"] == today.month

    invalid_response = client.get(
        "/api/v1/calendar",
        headers=headers,
        params={"year": 2026, "month": 13},
    )
    assert invalid_response.status_code == 422
