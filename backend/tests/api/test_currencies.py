from datetime import date


def _auth_headers(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "currency@example.com",
            "full_name": "Currency Owner",
            "password": "super-secret",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_currencies_api_lists_supported_codes_and_missing_rate_fallback(client) -> None:
    headers = _auth_headers(client)

    list_response = client.get("/api/v1/currencies", headers=headers)
    assert list_response.status_code == 200
    assert [item["code"] for item in list_response.json()["items"]] == [
        "USD",
        "EUR",
        "GBP",
        "CAD",
        "AUD",
        "JPY",
        "INR",
    ]

    rate_response = client.get(
        "/api/v1/currencies/rate",
        headers=headers,
        params={
            "base_currency": "CAD",
            "quote_currency": "INR",
            "effective_date": date(2026, 4, 21).isoformat(),
        },
    )

    assert rate_response.status_code == 200
    assert rate_response.json() == {
        "base_currency": "CAD",
        "quote_currency": "INR",
        "effective_date": "2026-04-21",
        "is_fallback": True,
        "rate": "1.000000",
        "source": "fallback",
    }
