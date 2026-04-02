import { expect, test } from "@playwright/test";

test("renders the day 1 shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("MySubscription Tracker")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Track every subscription",
  );
});
