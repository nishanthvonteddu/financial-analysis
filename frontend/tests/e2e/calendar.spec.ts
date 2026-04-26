import { expect, test } from "@playwright/test";

import { createSubscription, resetWorkspace, uniqueLabel } from "./support/session";

function firstOfNextMonth() {
  const value = new Date();
  value.setMonth(value.getMonth() + 1, 1);
  return value;
}

function isoDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(value);
}

test.beforeEach(async ({ request }) => {
  await resetWorkspace(request);
});

test("shows projected renewals in the calendar grid and detail panel", async ({ page, request }) => {
  const nextMonth = firstOfNextMonth();
  const renewalName = uniqueLabel("Calendar Pro");

  await createSubscription(request, {
    amount: "24.00",
    cadence: "monthly",
    name: renewalName,
    next_charge_date: isoDate(nextMonth),
    start_date: isoDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth() - 2, 1)),
  });

  await page.goto("/calendar");
  await page.getByRole("button", { name: "Next month" }).click();

  await expect(page.getByRole("heading", { name: monthLabel(nextMonth) })).toBeVisible();
  await expect(page.getByRole("button", { name: /1 renewal/ }).first()).toBeVisible();
  await expect(page.getByText(renewalName).first()).toBeVisible();
  await expect(page.getByText("$24.00").first()).toBeVisible();
});
