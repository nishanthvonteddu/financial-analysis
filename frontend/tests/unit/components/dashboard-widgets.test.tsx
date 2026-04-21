import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardWidgetCard } from "@/components/dashboard/widget-library";
import type { DashboardSummary, DashboardWidgetId } from "@/types";

const fullSummary: DashboardSummary = {
  active_subscriptions: [
    {
      amount: "15.99",
      cadence: "monthly",
      category_name: "Entertainment",
      currency: "USD",
      name: "Netflix",
      next_charge_date: "2026-04-15",
      subscription_id: 1,
      vendor: "Netflix",
    },
    {
      amount: "9.99",
      cadence: "monthly",
      category_name: "Productivity",
      currency: "USD",
      name: "Dropbox",
      next_charge_date: "2026-04-21",
      subscription_id: 2,
      vendor: "Dropbox",
    },
  ],
  category_breakdown: [
    {
      category_id: 10,
      category_name: "Entertainment",
      currency: "USD",
      subscriptions: 2,
      total_monthly_spend: "25.98",
    },
    {
      category_id: 11,
      category_name: "Productivity",
      currency: "USD",
      subscriptions: 1,
      total_monthly_spend: "9.99",
    },
  ],
  monthly_spend: [
    { currency: "USD", label: "Jan", month: "2026-01", total: "0.00" },
    { currency: "USD", label: "Feb", month: "2026-02", total: "0.00" },
    { currency: "USD", label: "Mar", month: "2026-03", total: "59.98" },
    { currency: "USD", label: "Apr", month: "2026-04", total: "86.50" },
  ],
  recently_ended: [
    {
      amount: "12.99",
      currency: "USD",
      end_date: "2026-04-05",
      name: "Headspace",
      subscription_id: 3,
      vendor: "Headspace",
    },
  ],
  summary: {
    active_subscriptions: 2,
    cancelled_subscriptions: 1,
    currency: "USD",
    total_monthly_spend: "35.97",
    upcoming_renewals: 2,
  },
  upcoming_renewals: [
    {
      amount: "15.99",
      currency: "USD",
      days_until_charge: 3,
      name: "Netflix",
      next_charge_date: "2026-04-15",
      subscription_id: 1,
      vendor: "Netflix",
    },
    {
      amount: "9.99",
      currency: "USD",
      days_until_charge: 9,
      name: "Dropbox",
      next_charge_date: "2026-04-21",
      subscription_id: 2,
      vendor: "Dropbox",
    },
  ],
};

const emptySummary: DashboardSummary = {
  active_subscriptions: [],
  category_breakdown: [],
  monthly_spend: [
    { currency: "USD", label: "Jan", month: "2026-01", total: "0.00" },
    { currency: "USD", label: "Feb", month: "2026-02", total: "0.00" },
  ],
  recently_ended: [],
  summary: {
    active_subscriptions: 0,
    cancelled_subscriptions: 0,
    currency: "USD",
    total_monthly_spend: "0.00",
    upcoming_renewals: 0,
  },
  upcoming_renewals: [],
};

describe("DashboardWidgetCard", () => {
  it.each<
    [DashboardWidgetId, string, DashboardSummary, string]
  >([
    ["active-subscriptions", "Active subscriptions", fullSummary, "Netflix"],
    ["monthly-spend", "Monthly spend", fullSummary, "Latest recorded month"],
    ["category-breakdown", "Category breakdown", fullSummary, "Entertainment"],
    ["upcoming-renewals", "Upcoming renewals", fullSummary, "3 days"],
    ["recently-ended", "Recently ended", fullSummary, "Headspace"],
  ])("renders %s with live data", (widgetId, title, summary, detailText) => {
    render(
      <div style={{ width: 720 }}>
        <DashboardWidgetCard summary={summary} widgetId={widgetId} />
      </div>,
    );

    expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    expect(screen.getByText(detailText)).toBeInTheDocument();
  });

  it.each<
    [DashboardWidgetId, string]
  >([
    ["active-subscriptions", "Add subscriptions or import statement data to populate the active roster."],
    ["monthly-spend", "Upload statement history to start plotting monthly spend."],
    ["category-breakdown", "Categorize active subscriptions to unlock the category breakdown."],
    ["upcoming-renewals", "Upcoming renewal dates will appear once active plans have charge schedules."],
    ["recently-ended", "Cancelled subscriptions with end dates will show up here."],
  ])("shows the empty state for %s", (widgetId, emptyText) => {
    render(
      <div style={{ width: 720 }}>
        <DashboardWidgetCard summary={emptySummary} widgetId={widgetId} />
      </div>,
    );

    expect(screen.getByText(emptyText)).toBeInTheDocument();
  });
});
