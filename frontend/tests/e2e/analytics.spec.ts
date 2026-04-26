import { expect, test } from "@playwright/test";

import { resetWorkspace, uniqueLabel, uploadCsvStatement } from "./support/session";

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test("renders report analytics charts with uploaded payment data", async ({ page, request }) => {
  await uploadCsvStatement(request, {
    amount: "15.49",
    fileName: "streaming-analytics.csv",
    vendor: uniqueLabel("NETFLIX"),
  });
  await uploadCsvStatement(request, {
    amount: "8.99",
    fileName: "music-analytics.csv",
    vendor: uniqueLabel("SPOTIFY"),
  });

  await page.goto("/reports");

  await expect(page.getByRole("heading", { name: "Category analytics" })).toBeVisible();
  await expect(page.getByText("Observed spend")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Spend by category over time" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overall spend trend" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Payment method mix" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Savings opportunities" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cadence distribution" })).toBeVisible();
  await expect(page.locator(".recharts-responsive-container svg")).toHaveCount(5);
});
