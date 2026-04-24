from datetime import date, timedelta


def _auth_headers(client, email: str, full_name: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create_subscription(
    client,
    headers: dict[str, str],
    *,
    name: str,
    vendor: str,
    amount: str,
) -> int:
    response = client.post(
        "/api/v1/subscriptions",
        headers=headers,
        json={
            "name": name,
            "vendor": vendor,
            "amount": amount,
            "currency": "USD",
            "cadence": "monthly",
            "status": "active",
            "start_date": str(date.today() - timedelta(days=60)),
            "next_charge_date": str(date.today() + timedelta(days=12)),
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_join_and_leave_family(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com", "Owner One")
    member_headers = _auth_headers(client, "member@example.com", "Member Two")

    create_response = client.post(
        "/api/v1/family",
        headers=owner_headers,
        json={"name": "Home plan"},
    )

    assert create_response.status_code == 201
    family_payload = create_response.json()
    assert family_payload["family"]["name"] == "Home plan"
    assert len(family_payload["members"]) == 1
    assert family_payload["current_member"]["role"] == "owner"
    assert family_payload["family"]["invite_code"]

    join_response = client.post(
        "/api/v1/family/join",
        headers=member_headers,
        json={"invite_code": family_payload["family"]["invite_code"]},
    )

    assert join_response.status_code == 200
    join_payload = join_response.json()
    assert len(join_payload["members"]) == 2
    assert join_payload["current_member"]["role"] == "member"

    duplicate_join_response = client.post(
        "/api/v1/family/join",
        headers=member_headers,
        json={"invite_code": family_payload["family"]["invite_code"]},
    )
    assert duplicate_join_response.status_code == 409

    leave_response = client.delete("/api/v1/family", headers=member_headers)
    assert leave_response.status_code == 204

    status_response = client.get("/api/v1/family", headers=member_headers)
    assert status_response.status_code == 200
    assert status_response.json() == {"current_member": None, "family": None, "members": []}


def test_family_dashboard_respects_member_privacy(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com", "Owner One")
    member_headers = _auth_headers(client, "member@example.com", "Member Two")
    private_headers = _auth_headers(client, "private@example.com", "Private Three")

    family_response = client.post(
        "/api/v1/family",
        headers=owner_headers,
        json={"name": "Household"},
    )
    assert family_response.status_code == 201
    invite_code = family_response.json()["family"]["invite_code"]

    assert client.post(
        "/api/v1/family/join",
        headers=member_headers,
        json={"invite_code": invite_code},
    ).status_code == 200
    assert client.post(
        "/api/v1/family/join",
        headers=private_headers,
        json={"invite_code": invite_code},
    ).status_code == 200

    _create_subscription(
        client,
        owner_headers,
        name="Netflix Owner",
        vendor="Netflix",
        amount="18.00",
    )
    _create_subscription(
        client,
        member_headers,
        name="Netflix Member",
        vendor="Netflix",
        amount="12.00",
    )
    _create_subscription(
        client,
        private_headers,
        name="Spotify Private",
        vendor="Spotify",
        amount="11.00",
    )

    privacy_response = client.patch(
        "/api/v1/family/privacy",
        headers=private_headers,
        json={"share_subscriptions": False},
    )
    assert privacy_response.status_code == 200
    assert privacy_response.json()["current_member"]["share_subscriptions"] is False

    dashboard_response = client.get("/api/v1/family/dashboard", headers=owner_headers)

    assert dashboard_response.status_code == 200
    payload = dashboard_response.json()
    assert payload["summary"] == {
        "currency": "USD",
        "family_name": "Household",
        "member_count": 3,
        "sharing_member_count": 2,
        "visible_active_subscriptions": 2,
        "visible_monthly_spend": "30.00",
    }
    assert payload["recommendations"] == [
        {
            "currency": "USD",
            "estimated_monthly_savings": "12.00",
            "member_names": ["Member Two", "Owner One"],
            "reason": "Multiple family members have active plans from the same vendor.",
            "subscription_count": 2,
            "vendor": "Netflix",
        }
    ]
    private_member = next(
        item for item in payload["member_spend"] if item["full_name"] == "Private Three"
    )
    assert private_member["visible"] is False
    assert private_member["active_subscriptions"] == 0
    assert private_member["monthly_spend"] == "0.00"


def test_family_dashboard_includes_current_users_private_data(client) -> None:
    owner_headers = _auth_headers(client, "owner@example.com", "Owner One")
    member_headers = _auth_headers(client, "member@example.com", "Member Two")

    family_response = client.post(
        "/api/v1/family",
        headers=owner_headers,
        json={"name": "Household"},
    )
    assert family_response.status_code == 201
    invite_code = family_response.json()["family"]["invite_code"]
    assert client.post(
        "/api/v1/family/join",
        headers=member_headers,
        json={"invite_code": invite_code},
    ).status_code == 200

    _create_subscription(
        client,
        owner_headers,
        name="Netflix Owner",
        vendor="Netflix",
        amount="18.00",
    )
    _create_subscription(
        client,
        member_headers,
        name="Spotify Member",
        vendor="Spotify",
        amount="10.00",
    )
    assert client.patch(
        "/api/v1/family/privacy",
        headers=member_headers,
        json={"share_subscriptions": False},
    ).status_code == 200

    owner_dashboard = client.get("/api/v1/family/dashboard", headers=owner_headers).json()
    member_dashboard = client.get("/api/v1/family/dashboard", headers=member_headers).json()

    assert owner_dashboard["summary"]["visible_active_subscriptions"] == 1
    assert owner_dashboard["summary"]["visible_monthly_spend"] == "18.00"
    assert member_dashboard["summary"]["visible_active_subscriptions"] == 2
    assert member_dashboard["summary"]["visible_monthly_spend"] == "28.00"
