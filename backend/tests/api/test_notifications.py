def _auth_headers(client, email: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Notification Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_notification_preferences_and_telegram_link_flow(client) -> None:
    headers = _auth_headers(client, "notifications@example.com")

    preferences_response = client.get("/api/v1/notifications/preferences", headers=headers)
    assert preferences_response.status_code == 200
    preferences = preferences_response.json()
    assert preferences["telegram_linked"] is False
    assert {
        (item["channel"], item["event_type"], item["is_enabled"])
        for item in preferences["items"]
    } == {
        ("email", "renewal_due", True),
        ("telegram", "renewal_due", False),
    }

    update_response = client.put(
        "/api/v1/notifications/preferences",
        headers=headers,
        json={
            "items": [
                {
                    "channel": "email",
                    "event_type": "renewal_due",
                    "is_enabled": False,
                    "quiet_hours_start": 22,
                    "quiet_hours_end": 7,
                }
            ]
        },
    )
    assert update_response.status_code == 200
    email_preference = next(
        item for item in update_response.json()["items"] if item["channel"] == "email"
    )
    assert email_preference["is_enabled"] is False
    assert email_preference["quiet_hours_start"] == 22

    token_response = client.post("/api/v1/notifications/telegram/link-token", headers=headers)
    assert token_response.status_code == 201
    token = token_response.json()["token"]
    assert token

    webhook_response = client.post(
        "/api/v1/notifications/telegram/webhook",
        json={"message": {"chat": {"id": 123456}, "text": f"/start {token}"}},
    )
    assert webhook_response.status_code == 200
    assert webhook_response.json() == {"action": "linked", "telegram_linked": True}

    linked_response = client.get("/api/v1/notifications/preferences", headers=headers)
    assert linked_response.status_code == 200
    linked = linked_response.json()
    assert linked["telegram_linked"] is True
    telegram_preference = next(item for item in linked["items"] if item["channel"] == "telegram")
    assert telegram_preference["is_enabled"] is True

    unlink_response = client.delete("/api/v1/notifications/telegram/link", headers=headers)
    assert unlink_response.status_code == 200
    assert unlink_response.json() == {"telegram_linked": False}


def test_notifications_can_be_marked_read(client) -> None:
    headers = _auth_headers(client, "read-notification@example.com")

    initial_response = client.get("/api/v1/notifications", headers=headers)
    assert initial_response.status_code == 200
    assert initial_response.json() == {"items": [], "total": 0, "unread_count": 0}

    missing_response = client.post("/api/v1/notifications/999/read", headers=headers)
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Notification not found."
