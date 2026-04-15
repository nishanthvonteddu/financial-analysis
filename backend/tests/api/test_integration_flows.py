from datetime import timedelta

from src.core.security import create_token


def _auth_payload(client, email: str) -> dict[str, object]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Integration Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return response.json()


def _auth_headers(payload: dict[str, object]) -> dict[str, str]:
    return {"Authorization": f"Bearer {payload['access_token']}"}


def _build_pdf_statement(lines: list[str]) -> bytes:
    def _escape(value: str) -> str:
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    stream = "BT\n/F1 12 Tf\n72 720 Td\n"
    for index, line in enumerate(lines):
        if index == 0:
            stream += f"({_escape(line)}) Tj\n"
        else:
            stream += f"0 -18 Td ({_escape(line)}) Tj\n"
    stream += "ET\n"

    objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        (
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
        ),
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        (
            f"5 0 obj\n<< /Length {len(stream.encode('latin1'))} >>\n"
            f"stream\n{stream}endstream\nendobj\n"
        ),
    ]

    content = "%PDF-1.4\n"
    offsets: list[int] = []
    for obj in objects:
        offsets.append(len(content.encode("latin1")))
        content += obj

    xref_offset = len(content.encode("latin1"))
    content += f"xref\n0 {len(objects) + 1}\n"
    content += "0000000000 65535 f \n"
    for offset in offsets:
        content += f"{offset:010d} 00000 n \n"
    content += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    )
    return content.encode("latin1")


def test_backend_integration_flow_covers_auth_catalog_subscriptions_and_uploads(client) -> None:
    auth_payload = _auth_payload(client, "integration@example.com")
    headers = _auth_headers(auth_payload)

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "integration@example.com", "password": "super-secret"},
    )
    assert login_response.status_code == 200

    category_response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": "Streaming", "description": "Recurring entertainment"},
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    payment_method_response = client.post(
        "/api/v1/payment-methods",
        headers=headers,
        json={"label": "Primary Card", "provider": "Visa", "last4": "4242", "is_default": True},
    )
    assert payment_method_response.status_code == 201
    payment_method_id = payment_method_response.json()["id"]

    subscription_response = client.post(
        "/api/v1/subscriptions",
        headers=headers,
        json={
            "name": "Netflix Family",
            "vendor": "Netflix",
            "amount": "15.49",
            "currency": "USD",
            "cadence": "monthly",
            "status": "active",
            "start_date": "2026-01-01",
            "next_charge_date": "2026-02-01",
            "category_id": category_id,
            "payment_method_id": payment_method_id,
            "website_url": "https://www.netflix.com",
            "notes": "Integration flow coverage",
        },
    )
    assert subscription_response.status_code == 201
    created_subscription = subscription_response.json()

    filtered_response = client.get(
        "/api/v1/subscriptions",
        headers=headers,
        params={
            "search": "netflix",
            "status": "active",
            "payment_method_id": payment_method_id,
            "min_amount": "10.00",
            "max_amount": "20.00",
        },
    )
    assert filtered_response.status_code == 200
    assert filtered_response.json()["items"][0]["id"] == created_subscription["id"]

    csv_upload_response = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={
            "file": (
                "hulu.csv",
                (
                    "Posting Date,Details,Amount\n"
                    "01/01/2026,HULU,-8.99\n"
                    "02/01/2026,HULU,-8.99\n"
                    "03/01/2026,HULU,-8.99\n"
                ),
                "text/csv",
            )
        },
    )
    assert csv_upload_response.status_code == 201

    pdf_upload_response = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={
            "file": (
                "netflix.pdf",
                _build_pdf_statement(
                    [
                        "CHASE STATEMENT 2026",
                        "04/01 NETFLIX 15.49",
                        "05/01 NETFLIX 15.49",
                        "06/01 NETFLIX 15.49",
                    ]
                ),
                "application/pdf",
            )
        },
    )
    assert pdf_upload_response.status_code == 201

    uploads_response = client.get("/api/v1/uploads", headers=headers)
    assert uploads_response.status_code == 200
    assert uploads_response.json()["total"] == 2
    assert {item["status"] for item in uploads_response.json()["items"]} == {"completed"}

    subscriptions_after_uploads = client.get("/api/v1/subscriptions", headers=headers)
    assert subscriptions_after_uploads.status_code == 200
    names = {item["name"] for item in subscriptions_after_uploads.json()["items"]}
    assert {"Netflix Family", "Hulu"} <= names

    update_category_response = client.patch(
        f"/api/v1/categories/{category_id}",
        headers=headers,
        json={"name": "Streaming Services", "description": "Updated label"},
    )
    assert update_category_response.status_code == 200

    update_payment_method_response = client.patch(
        f"/api/v1/payment-methods/{payment_method_id}",
        headers=headers,
        json={"label": "Updated Card", "provider": "Visa", "last4": "1111", "is_default": True},
    )
    assert update_payment_method_response.status_code == 200

    delete_subscription_response = client.delete(
        f"/api/v1/subscriptions/{created_subscription['id']}",
        headers=headers,
    )
    assert delete_subscription_response.status_code == 204


def test_expired_access_tokens_are_rejected_and_refresh_requires_refresh_tokens(client) -> None:
    auth_payload = _auth_payload(client, "expired-flow@example.com")
    headers = _auth_headers(auth_payload)

    expired_access_token, _ = create_token(
        subject=str(auth_payload["user"]["id"]),
        token_type="access",
        expires_delta=timedelta(seconds=-1),
    )

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_access_token}"},
    )
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == "Invalid or expired token."

    wrong_refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": auth_payload["access_token"]},
    )
    assert wrong_refresh_response.status_code == 401
    assert wrong_refresh_response.json()["detail"] == "Refresh token required."

    delete_response = client.delete("/api/v1/auth/me/data", headers=headers)
    assert delete_response.status_code == 204
