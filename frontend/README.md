# MySubscription Tracker Frontend

Next.js App Router frontend for the MySubscription Tracker workspace.

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
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | Browser API base URL |

## Scripts

```bash
npm run dev             # Next.js development server
npm run build           # Production build
npm run build:analyze   # Production build with bundle analyzer
npm run start           # Serve a production build
npm run lint            # Next.js lint
npm run typecheck       # TypeScript check
npm run test            # Vitest unit tests
npm run test:watch      # Watch-mode unit tests
npm run test:coverage   # Unit tests with coverage
npm run test:e2e        # Playwright E2E suite
```

## App Routes

Public routes:

- `/` landing page
- `/login`
- `/register`
- `/privacy`

Authenticated workspace routes:

- `/dashboard` snapshot bar, onboarding, widgets, layout persistence
- `/uploads` CSV/PDF intake, processing status, history, delete actions
- `/subscriptions` searchable subscription management and manual entry
- `/subscriptions/[subscriptionId]` subscription detail and payment history
- `/reports` expense reports and analytics charts
- `/exports` CSV, JSON, and iCalendar downloads
- `/score` subscription health score and duplicate candidates
- `/family` household sharing, invite, member privacy, recommendations
- `/calendar` renewal calendar
- `/payments` payment rail placeholder and billing navigation
- `/settings` profile, currency, categories, payment methods, theme, destructive reset

## Component Guide

- Route pages in `src/app` should stay thin and compose workspace components from
  `src/components`.
- API access lives in `src/lib/api-client.ts`; feature hooks in `src/hooks` wrap React Query
  mutations and queries.
- Shared UI primitives live in `src/components/ui`. Prefer these before adding route-local
  button, dialog, empty-state, skeleton, or page-header patterns.
- Authenticated pages render inside `src/components/app-shell/app-shell.tsx`, which owns
  navigation, route metadata, workspace search labels, notification access, and sign-out.
- Domain components live in feature folders: `dashboard`, `uploads`, `subscriptions`,
  `reports`, `exports`, `family`, `notifications`, `onboarding`.
- Form validation should use local Zod schemas or shared validators from `src/lib/validators.ts`.
- Currency formatting should use `CurrencyDisplay` or helpers from `src/lib/currency.ts`.

## Testing

Unit tests:

```bash
npm run test
```

E2E tests:

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright npm run test:e2e
```

The E2E suite starts the Next.js app and backend test server through Playwright config and
shared setup helpers. CI installs Chromium, Firefox, and WebKit before running the matrix.
