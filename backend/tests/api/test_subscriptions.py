from datetime import date


def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Owner One",
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
        json={"name": name, "description": "Grouped services"},
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


def test_subscriptions_support_crud_and_filters(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com")
    category_id = _create_category(client, owner_headers)
    payment_method_id = _create_payment_method(client, owner_headers)

    create_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Netflix",
            "vendor": "Netflix",
            "description": "Primary streaming service",
            "amount": "15.49",
            "currency": "usd",
            "cadence": "monthly",
            "status": "active",
            "start_date": "2026-04-01",
            "next_charge_date": "2026-05-01",
            "day_of_month": 1,
            "category_id": category_id,
            "payment_method_id": payment_method_id,
            "auto_renew": True,
            "notes": "Family plan",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["currency"] == "USD"
    assert created["status"] == "active"
    assert created["payment_method_id"] == payment_method_id

    second_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Hulu",
            "vendor": "Hulu",
            "amount": "8.99",
            "currency": "USD",
            "cadence": "monthly",
            "status": "paused",
            "start_date": "2026-03-15",
            "category_id": category_id,
            "auto_renew": False,
        },
    )
    assert second_response.status_code == 201

    list_response = client.get(
        "/api/v1/subscriptions",
        headers=owner_headers,
        params={"status": "active", "search": "net", "limit": 10, "offset": 0},
    )
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["items"][0]["name"] == "Netflix"

    get_response = client.get(f"/api/v1/subscriptions/{created['id']}", headers=owner_headers)
    assert get_response.status_code == 200
    assert get_response.json()["category_id"] == category_id

    update_response = client.patch(
        f"/api/v1/subscriptions/{created['id']}",
        headers=owner_headers,
        json={
            "amount": "17.99",
            "status": "cancelled",
            "end_date": "2026-06-01",
            "notes": "Cancelled after price increase",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["amount"] == "17.99"
    assert updated["status"] == "cancelled"
    assert updated["end_date"] == "2026-06-01"

    delete_response = client.delete(f"/api/v1/subscriptions/{created['id']}", headers=owner_headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/v1/subscriptions/{created['id']}", headers=owner_headers)
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Subscription not found."


def test_subscriptions_enforce_validation_and_ownership(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com")
    other_headers = _auth_headers(client, "other@example.com")

    category_id = _create_category(client, owner_headers, "Productivity")
    owner_payment_method_id = _create_payment_method(client, owner_headers, "Owner Card")
    other_payment_method_id = _create_payment_method(client, other_headers, "Other Card")

    invalid_amount_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Invalid Service",
            "vendor": "Invalid Service",
            "amount": "0",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
        },
    )
    assert invalid_amount_response.status_code == 422

    cross_user_payment_method_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Shared Service",
            "vendor": "Shared Service",
            "amount": "12.00",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
            "category_id": category_id,
            "payment_method_id": other_payment_method_id,
        },
    )
    assert cross_user_payment_method_response.status_code == 404
    assert cross_user_payment_method_response.json()["detail"] == "Payment method not found."

    owner_subscription_response = client.post(
        "/api/v1/subscriptions",
        headers=owner_headers,
        json={
            "name": "Notion",
            "vendor": "Notion",
            "amount": "10.00",
            "currency": "USD",
            "cadence": "monthly",
            "start_date": "2026-04-01",
            "category_id": category_id,
            "payment_method_id": owner_payment_method_id,
        },
    )
    assert owner_subscription_response.status_code == 201
    subscription_id = owner_subscription_response.json()["id"]

    other_user_get_response = client.get(
        f"/api/v1/subscriptions/{subscription_id}",
        headers=other_headers,
    )
    assert other_user_get_response.status_code == 404
    assert other_user_get_response.json()["detail"] == "Subscription not found."

    invalid_dates_response = client.patch(
        f"/api/v1/subscriptions/{subscription_id}",
        headers=owner_headers,
        json={"start_date": str(date(2026, 4, 10)), "end_date": str(date(2026, 4, 5))},
    )
    assert invalid_dates_response.status_code == 422
    assert invalid_dates_response.json()["detail"] == "end_date must be on or after start_date."
