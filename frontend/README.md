# FinSight Frontend

Next.js App Router frontend for the FinSight financial analysis platform.

## Requirements

- Node.js 22
- npm
- Backend API running on `http://localhost:8000/api/v1`

## Setup

```bash
cd frontend
npm ci
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | API base URL used by the browser client |

## Scripts

```bash
npm run dev             # Next.js development server
npm run build           # Production build
npm run build:analyze   # Production build with bundle analyzer
npm run start           # Serve production build
npm run lint            # Next.js ESLint
npm run typecheck       # TypeScript type check
npm run test            # Vitest unit tests
npm run test:watch      # Watch-mode unit tests
npm run test:coverage   # Unit tests with coverage report
npm run test:e2e        # Playwright E2E suite
```

## Routes

**Public:**

- `/` — Landing page
- `/login` — Sign in
- `/register` — Create account
- `/privacy` — Privacy policy

**Authenticated workspace:**

- `/dashboard` — Financial overview, widgets, onboarding
- `/uploads` — Statement intake (CSV/PDF), processing status, history
- `/subscriptions` — Subscription list and manual entry
- `/subscriptions/[id]` — Subscription detail and payment history
- `/reports` — Expense reports and analytics charts
- `/exports` — CSV, JSON, and iCalendar downloads
- `/score` — Subscription health score and duplicate detection
- `/family` — Household sharing and member management
- `/calendar` — Renewal calendar
- `/payments` — Payment methods and billing
- `/settings` — Profile, currency, categories, theme, account reset

## Architecture Notes

- Route pages in `src/app` stay thin and compose feature components from `src/components`
- API access is in `src/lib/api-client.ts`; feature hooks in `src/hooks` wrap React Query
- Shared UI primitives live in `src/components/ui` — use these before adding route-local patterns
- Authenticated pages render inside `src/components/app-shell/app-shell.tsx` which owns navigation, search, notifications, and sign-out
- Domain components live in feature folders: `dashboard`, `uploads`, `subscriptions`, `reports`, `exports`, `family`, `notifications`, `onboarding`
- Form validation uses Zod schemas (local or shared via `src/lib/validators.ts`)
- Currency formatting goes through `CurrencyDisplay` or helpers in `src/lib/currency.ts`

## Testing

```bash
# Unit tests
npm run test

# E2E tests
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright npm run test:e2e
```
