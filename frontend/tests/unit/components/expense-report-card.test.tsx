import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExpenseReportCard } from "@/components/reports/expense-report-card";
import type { ExpenseReport } from "@/types";

const report: ExpenseReport = {
  created_at: "2026-04-17T00:00:00Z",
  currency: "USD",
  data_source_id: 14,
  generated_at: "2026-04-17T15:00:00Z",
  id: 3,
  period_end: "2026-03-09",
  period_start: "2026-01-05",
  report_status: "ready",
  summary: {
    average_transaction: "14.50",
    category_breakdown: [
      {
        category_name: "Entertainment",
        total_amount: "57.99",
        transaction_count: 4,
      },
    ],
    largest_transaction: "18.00",
    merchant_count: 2,
    provider: "csv",
    recurring_transaction_count: 3,
    spend_timeline: [],
    top_merchants: [
      {
        merchant: "Netflix",
        total_amount: "48.00",
        transaction_count: 3,
      },
    ],
    transaction_count: 4,
    upload_name: "expense-history.csv",
  },
  total_amount: "57.99",
  updated_at: "2026-04-17T15:00:00Z",
  user_id: 1,
};

describe("ExpenseReportCard", () => {
  it("shows the uploaded report summary and total spend", () => {
    render(<ExpenseReportCard report={report} />);

    expect(screen.getByText("expense-history.csv")).toBeVisible();
    expect(screen.getByText("3 recurring candidates")).toBeVisible();
    expect(screen.getByText("$57.99")).toBeVisible();
    expect(screen.getByText("4 charges")).toBeVisible();
  });

  it("calls onSelect when the card is clicked", async () => {
    const onSelect = vi.fn();

    render(<ExpenseReportCard onSelect={onSelect} report={report} />);

    await screen.getByRole("button").click();

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
