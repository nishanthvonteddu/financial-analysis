import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { buildCsvStatement, buildPdfStatement, resetWorkspace } from "./support/session";

async function waitForUploadCompletion(page: Page) {
  return page.waitForResponse(async (response) => {
    if (
      !response.url().includes("/api/v1/uploads/") ||
      !response.url().endsWith("/status") ||
      response.request().method() !== "GET" ||
      !response.ok()
    ) {
      return false;
    }

    const payload = (await response.json().catch(() => null)) as { status?: string } | null;
    return payload?.status === "completed";
  });
}

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test("uploads CSV and PDF statements and shows detected subscriptions", async ({ page }) => {
  await page.goto("/uploads");

  const csvCreate = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/uploads") &&
      response.request().method() === "POST" &&
      response.ok(),
  );
  const csvCompleted = waitForUploadCompletion(page);

  await page.getByLabel("Upload statement").setInputFiles({
    buffer: Buffer.from(buildCsvStatement("HULU", "8.99")),
    mimeType: "text/csv",
    name: "hulu-statement.csv",
  });

  await csvCreate;
  await csvCompleted;

  await expect(page.getByRole("heading", { name: "hulu-statement.csv" })).toBeVisible();

  const pdfCreate = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/uploads") &&
      response.request().method() === "POST" &&
      response.ok(),
  );
  const pdfCompleted = waitForUploadCompletion(page);

  await page.getByLabel("Upload statement").setInputFiles({
    buffer: buildPdfStatement([
      "CHASE STATEMENT 2026",
      "04/01 NETFLIX 15.49",
      "05/01 NETFLIX 15.49",
      "06/01 NETFLIX 15.49",
    ]),
    mimeType: "application/pdf",
    name: "netflix-statement.pdf",
  });

  await pdfCreate;
  await pdfCompleted;

  await page
    .getByRole("button")
    .filter({ has: page.getByText("netflix-statement.pdf", { exact: true }) })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "netflix-statement.pdf" })).toBeVisible();

  await page.goto("/subscriptions");
  await expect(page.getByRole("heading", { name: "Hulu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Netflix" })).toBeVisible();
});
