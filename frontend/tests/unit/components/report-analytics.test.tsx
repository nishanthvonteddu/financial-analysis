import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReportAnalytics } from "@/components/reports/report-analytics";
import type { ExpenseAnalytics } from "@/types";

const analytics: ExpenseAnalytics = {
  categories: [
    {
      active_subscriptions: 1,
      category_id: 1,
      category_name: "Utilities",
      currency: "USD",
      projected_monthly_savings: "30.00",
      projected_range_savings: "180.00",
      total_spend: "90.00",
    },
    {
      active_subscriptions: 2,
      category_id: 2,
      category_name: "Entertainment",
      currency: "USD",
      projected_monthly_savings: "25.00",
      projected_range_savings: "150.00",
      total_spend: "40.00",
    },
  ],
  frequency_distribution: [
    {
      cadence: "monthly",
      currency: "USD",
      label: "Monthly cadence",
      monthly_equivalent: "25.00",
      subscription_count: 2,
    },
    {
      cadence: "quarterly",
      currency: "USD",
      label: "Quarterly cadence",
      monthly_equivalent: "30.00",
      subscription_count: 1,
    },
  ],
  payment_methods: [
    {
      active_subscriptions: 2,
      payment_method_id: 11,
      payment_method_label: "Visa Primary card ending 4242",
      provider: "Visa",
      currency: "USD",
      total_spend: "150.00",
    },
    {
      active_subscriptions: 2,
      payment_method_id: 12,
      payment_method_label: "Amex Backup card ending 3005",
      provider: "Amex",
      currency: "USD",
      total_spend: "100.00",
    },
  ],
  summary: {
    active_subscriptions: 4,
    average_monthly_spend: "41.67",
    currency: "USD",
    projected_monthly_savings: "65.00",
    projected_range_savings: "390.00",
    total_spend: "250.00",
  },
  trend_categories: ["Utilities", "Entertainment"],
  trends: [
    {
      category_totals: [
        { category_name: "Utilities", currency: "USD", total_spend: "90.00" },
        { category_name: "Entertainment", currency: "USD", total_spend: "15.00" },
      ],
      currency: "USD",
      label: "Mar",
      period_start: "2026-03-01",
      total_spend: "105.00",
    },
    {
      category_totals: [
        { category_name: "Utilities", currency: "USD", total_spend: "0.00" },
        { category_name: "Entertainment", currency: "USD", total_spend: "25.00" },
      ],
      currency: "USD",
      label: "Apr",
      period_start: "2026-04-01",
      total_spend: "25.00",
    },
  ],
  window: {
    end_date: "2026-04-19",
    key: "180d",
    label: "Last 180 days",
    start_date: "2025-10-22",
  },
};

describe("ReportAnalytics", () => {
  it("renders the analytics workspace with mock chart data", () => {
    render(
      <div style={{ width: 1280 }}>
        <ReportAnalytics
          analytics={analytics}
          isLoading={false}
          onRangeChange={vi.fn()}
          selectedRange="180d"
        />
      </div>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Category analytics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Spend by category over time" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Overall spend trend" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Payment method mix" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Potential savings" })).toBeInTheDocument();
    expect(screen.getByText("Visa Primary card ending 4242")).toBeInTheDocument();
    expect(screen.getByText("Utilities")).toBeInTheDocument();
    expect(screen.getByText("Monthly cadence")).toBeInTheDocument();
  });

  it("changes the selected range when a new window is requested", () => {
    const onRangeChange = vi.fn();

    render(
      <div style={{ width: 1280 }}>
        <ReportAnalytics
          analytics={analytics}
          isLoading={false}
          onRangeChange={onRangeChange}
          selectedRange="180d"
        />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Last 365 days" }));
    expect(onRangeChange).toHaveBeenCalledWith("365d");
  });
});
