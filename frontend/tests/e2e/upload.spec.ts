import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { buildCsvStatement, buildPdfStatement, resetWorkspace } from "./support/session";

async function waitForUploadCompletion(page: Page, fileName: string) {
  await expect(page.getByTestId("upload-selected-file-name")).toHaveText(fileName);
  await expect(page.getByTestId("upload-current-status")).toHaveText("completed");
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

  await page.getByLabel("Upload statement").setInputFiles({
    buffer: Buffer.from(buildCsvStatement("HULU", "8.99")),
    mimeType: "text/csv",
    name: "hulu-statement.csv",
  });

  await csvCreate;
  await waitForUploadCompletion(page, "hulu-statement.csv");

  await expect(page.getByRole("heading", { name: "hulu-statement.csv" })).toBeVisible();

  const pdfCreate = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/uploads") &&
      response.request().method() === "POST" &&
      response.ok(),
  );

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
  await waitForUploadCompletion(page, "netflix-statement.pdf");

  await page.locator('button[data-upload-file-name="netflix-statement.pdf"]').click();
  await expect(page.getByRole("heading", { name: "netflix-statement.pdf" })).toBeVisible();

  await page.goto("/subscriptions");
  await expect(page.getByRole("heading", { name: "Hulu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Netflix" })).toBeVisible();
});
