# MySubscription Tracker API

Base URL: `http://localhost:8000/api/v1`

Runtime documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Exported schema: `backend/docs/openapi.json`

## Authentication

Register or log in to receive an access token and refresh token. Send the access token on
authenticated requests:

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8000/api/v1/subscriptions
```

Browser-origin state-changing requests are protected by origin and CSRF checks. The frontend
API client attaches the required CSRF header automatically.

## Core Examples

Register:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","full_name":"Jordan Lee","password":"change-me-123"}'
```

Create a subscription:

```bash
curl -X POST http://localhost:8000/api/v1/subscriptions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Netflix",
    "amount": "22.99",
    "currency": "USD",
    "billing_cycle": "monthly",
    "next_billing_date": "2026-05-15",
    "status": "active"
  }'
```

Upload a statement:

```bash
curl -X POST http://localhost:8000/api/v1/uploads \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@statement.csv"
```

Export active subscriptions as iCalendar:

```bash
curl -L "http://localhost:8000/api/v1/exports?format=ical&active_only=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o subscriptions.ics
```

## Endpoint Groups

### Health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Service readiness and uptime check. |

### Auth and Profile

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account and return tokens. |
| `POST` | `/auth/login` | Authenticate with email and password. |
| `POST` | `/auth/refresh` | Refresh an authenticated session. |
| `GET` | `/auth/me` | Return the current user profile. |
| `PATCH` | `/auth/me` | Update profile fields such as name and preferred currency. |
| `DELETE` | `/auth/me/data` | Delete workspace-owned user data while preserving the account. |

### Subscriptions

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/subscriptions` | List subscriptions with search, status, cadence, category, payment method, and amount filters. |
| `POST` | `/subscriptions` | Create a manual subscription. |
| `GET` | `/subscriptions/{subscription_id}` | Fetch one subscription. |
| `PATCH` | `/subscriptions/{subscription_id}` | Update lifecycle, pricing, renewal, category, and payment details. |
| `DELETE` | `/subscriptions/{subscription_id}` | Remove one subscription. |
| `GET` | `/subscriptions/{subscription_id}/payment-history` | List payment history linked to one subscription. |

### Uploads and Parsing

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/uploads` | Upload CSV or PDF statement files for parsing and recurring charge detection. |
| `GET` | `/uploads` | List upload history and processing state. |
| `GET` | `/uploads/{upload_id}/status` | Poll queue, processing, completed, or failed status. |
| `DELETE` | `/uploads/{upload_id}` | Delete upload metadata and stored file references owned by the user. |

### Dashboard, Reports, and Score

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/dashboard/summary` | Spend totals, active subscriptions, upcoming renewals, category mix, uploads, and score summary. |
| `GET` | `/dashboard/layout` | Fetch saved widget layout. |
| `PUT` | `/dashboard/layout` | Replace saved widget layout. |
| `GET` | `/dashboard/score` | Subscription health score and duplicate candidates. |
| `GET` | `/expense-reports` | List generated expense reports. |
| `GET` | `/expense-reports/{report_id}` | Fetch one report. |
| `GET` | `/expense-reports/analytics` | Return chart-ready spend analytics by range. |

### Settings Data

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/categories` | List user categories. |
| `POST` | `/categories` | Create a category. |
| `GET` | `/categories/{category_id}` | Fetch one category. |
| `PATCH` | `/categories/{category_id}` | Update category metadata. |
| `DELETE` | `/categories/{category_id}` | Delete an unused category. |
| `GET` | `/payment-methods` | List user payment methods. |
| `POST` | `/payment-methods` | Create a payment method. |
| `GET` | `/payment-methods/{payment_method_id}` | Fetch one payment method. |
| `PATCH` | `/payment-methods/{payment_method_id}` | Update label, provider, default flag, or card tail. |
| `DELETE` | `/payment-methods/{payment_method_id}` | Delete an unused payment method. |

### Calendar, Exports, and Currency

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/calendar` | Return monthly renewal events. |
| `GET` | `/exports` | Download CSV, JSON, or iCalendar subscription exports. |
| `GET` | `/currencies` | List supported currencies. |
| `GET` | `/currencies/rate` | Convert between supported currencies. |

### Family Sharing

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/family` | Fetch the current household workspace and member roster. |
| `POST` | `/family` | Create a household workspace. |
| `POST` | `/family/join` | Join by invite code. |
| `PATCH` | `/family/privacy` | Toggle sharing privacy for the current member. |
| `DELETE` | `/family` | Leave the current household workspace. |
| `GET` | `/family/dashboard` | Shared household metrics and plan recommendations. |

### Notifications

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/notifications` | List notifications. |
| `POST` | `/notifications/{notification_id}/read` | Mark one notification read. |
| `POST` | `/notifications/read-all` | Mark all notifications read. |
| `GET` | `/notifications/preferences` | Fetch reminder and channel preferences. |
| `PUT` | `/notifications/preferences` | Update reminder and channel preferences. |
| `POST` | `/notifications/telegram/link-token` | Create a short-lived Telegram link token. |
| `DELETE` | `/notifications/telegram/link` | Remove a linked Telegram chat. |
| `POST` | `/notifications/telegram/webhook` | Receive Telegram webhook callbacks. |

## Regenerating the Schema

```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv run python - <<'PY'
import json
from pathlib import Path
from src.main import create_app

Path("docs/openapi.json").write_text(
    json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n"
)
PY
```
