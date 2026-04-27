import { expect, test } from "@playwright/test";

import {
  createSubscription,
  resetWorkspace,
  uniqueLabel,
  uploadCsvStatement,
} from "./support/session";

const responsiveRoutes = [
  { path: "/reports", title: "Reports" },
  { path: "/calendar", title: "Calendar" },
  { path: "/exports", title: "Exports" },
  { path: "/family", title: "Family" },
  { path: "/score", title: "Subscription score" },
];

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test("keeps Phase 2 and 3 workspaces usable on a phone viewport", async ({ page, request }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await createSubscription(request, {
    amount: "15.49",
    name: uniqueLabel("Mobile Plan"),
    next_charge_date: "2026-05-01",
    start_date: "2026-01-01",
  });
  await uploadCsvStatement(request, {
    amount: "15.49",
    fileName: "mobile-report.csv",
    vendor: uniqueLabel("MOBILE STREAM"),
  });

  for (const route of responsiveRoutes) {
    await page.goto(route.path);
    await expect(page.getByTestId("app-shell-route-title")).toHaveText(route.title);

    const metrics = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  }
});
