# Changelog

## Unreleased

- Day 30 final QA remains the next scheduled verification milestone.

## Day 29 - Documentation

- Added complete root, backend, frontend, API, OpenAPI, privacy, and milestone-history documentation.

## Day 28 - Performance Optimization

- Added gzip, private cache headers, slow SQL logging, selected-column dashboard loads,
  performance indexes, dynamic dashboard/report chunks, route prefetching, and bundle analysis.
- Verified the production landing page with a Lighthouse Performance score above 90.

## Day 27 - Security Hardening

- Added encrypted Telegram fields with blind indexes, rate limiting, request size limits,
  security headers, authenticated CSRF checks, and safer session storage.
- Removed Telegram chat IDs from logs and added security coverage.

## Day 26 - UI Polish and Design Consistency

- Polished global tokens, focus visibility, reduced-motion handling, shared buttons,
  page headers, dialogs, app-shell landmarks, dark mode, and mobile navigation.

## Day 25 - Integration Testing Phase 2 and 3

- Added backend performance indexes and E2E coverage for analytics, calendar, exports,
  uploads, and responsive workspace behavior.

## Day 24 - Data Export

- Added authenticated CSV, JSON, and iCalendar exports with active-only, payment-history,
  and calendar-horizon options plus a frontend export workspace.

## Day 23 - Family Sharing View

- Added household creation, invite joining, leave flow, member privacy controls, shared
  dashboard metrics, and shared-plan recommendations.

## Day 22 - Subscription Score and Duplicates

- Added the subscription health score, duplicate candidate detection, score endpoint,
  dashboard widgets, and a dedicated score workspace.

## Day 21 - Notification Polish

- Added notification preference management, reminder controls, Telegram linking, and
  authenticated notification list/read flows.

## Day 20 - Calendar and Renewal Reminders

- Added monthly renewal calendar data, frontend calendar workspace, and reminder-oriented
  renewal visibility.

## Day 19 - Reports and Analytics

- Added expense report listing/detail, analytics aggregates, chart-backed report views,
  and report navigation from uploaded statement data.

## Day 18 - Multi-Currency Support

- Added supported currencies, exchange-rate lookup, preferred currency handling, and
  currency-aware display in subscription and dashboard surfaces.

## Day 17 - Expense Report Generation

- Added generated expense reports from parsed raw transactions and linked reports into
  the authenticated workspace.

## Day 16 - User Data Scoping

- Scoped categories, payment methods, subscriptions, uploads, reports, and settings data
  to the authenticated user.

## Day 15 - MVP Completion

- Completed the MVP pass across public landing, authentication, uploads, subscriptions,
  dashboard, onboarding, settings, and app-level error handling.

## Day 14 - Onboarding and Empty States

- Added workspace onboarding, empty states, loading states, and route-level guidance for
  first-run users.

## Day 13 - Integration Testing E2E

- Added Playwright global setup, shared session helpers, E2E specs for core flows, CI
  browser installation, and backend integration-flow tests.

## Day 12 - Search, Filters, and Settings

- Added URL-synced subscription filters, debounce helpers, settings CRUD for categories
  and payment methods, profile currency controls, and workspace data deletion.

## Day 11 - Dashboard Widgets

- Added persisted dashboard widget layout, active subscription rows, monthly spend,
  category breakdown, upcoming renewals, recently ended plans, and charting dependencies.

## Day 10 - Dashboard API Snapshot

- Added dashboard summary aggregation, persistent layout endpoints, live frontend snapshot
  widgets, and dashboard contract tests.

## Day 9 - Upload UI and Processing Status

- Added drag-and-drop upload intake, XHR progress, processing status rail, upload history,
  delete actions, service logos, and upload API client hooks.

## Day 8 - Subscription Detection Engine

- Added recurring merchant grouping, cadence analysis, confidence scoring, category
  auto-creation, subscription sync, and payment-history linking from uploads.

## Day 7 - Parsing Templates and Normalizer

- Added institution parsing templates, merchant normalization, known-service aliases,
  ARQ worker wiring, and explicit CSV/PDF processing jobs.

## Day 6 - PDF and CSV Upload Parsing

- Added upload metadata, upload endpoints, CSV/PDF extraction services, Chase/generic
  parsing support, and raw transaction storage.

## Day 5 - Manual Entry Subscription Management

- Added subscription CRUD with website URLs, manual-entry UI, detail views, and React
  Query hooks for subscription management.

## Day 4 - Authentication

- Added registration, login, refresh, current-user profile, protected frontend routes,
  and authenticated app providers.

## Day 3 - Core Data Models

- Added subscription, category, payment method, payment history, upload, raw transaction,
  notification, and dashboard persistence models.

## Day 2 - Frontend Foundations

- Added the Next.js app shell, Tailwind setup, shared UI primitives, providers, and
  initial test harness.

## Day 1 - Project Bootstrap

- Added the FastAPI skeleton, database layer, logging, storage and email abstractions,
  Docker Compose, Makefile, and backend/frontend CI workflows.
