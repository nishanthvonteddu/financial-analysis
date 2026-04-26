import { expect, test } from "@playwright/test";

import { createSubscription, resetWorkspace, uniqueLabel } from "./support/session";

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test.skip(({ isMobile }) => isMobile, "Download behavior is verified in desktop browsers.");

test("downloads CSV JSON and iCal exports from the export center", async ({ page, request }) => {
  await createSubscription(request, {
    amount: "19.99",
    name: uniqueLabel("Export Plan"),
    next_charge_date: "2026-05-01",
    start_date: "2026-01-01",
  });

  await page.goto("/exports");
  await expect(page.getByRole("heading", { name: "Export center" })).toBeVisible();

  for (const { buttonName, extension } of [
    { buttonName: "CSV", extension: ".csv" },
    { buttonName: "JSON", extension: ".json" },
    { buttonName: "iCal", extension: ".ics" },
  ]) {
    await page.getByRole("button", { name: buttonName }).click();
    const download = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download export" }).click(),
    ]).then(([nextDownload]) => nextDownload);

    expect(download.suggestedFilename()).toContain(extension);
    await expect(page.getByText(download.suggestedFilename(), { exact: true })).toBeVisible();
  }
});
