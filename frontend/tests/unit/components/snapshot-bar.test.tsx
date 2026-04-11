import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SnapshotBar } from "@/components/dashboard/snapshot-bar";

describe("SnapshotBar", () => {
  it("renders all four dashboard summary metrics", () => {
    render(
      <SnapshotBar
        summary={{
          active_subscriptions: 12,
          cancelled_subscriptions: 3,
          total_monthly_spend: "245.99",
          upcoming_renewals: 7,
        }}
      />,
    );

    expect(screen.getByText("Total spend")).toBeInTheDocument();
    expect(screen.getByText("$245.99")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/7 charges are due within the next 30 days/i)).toBeInTheDocument();
  });

  it("shows loading placeholders before the summary is available", () => {
    render(<SnapshotBar isLoading />);

    expect(screen.getByText("Total spend")).toBeInTheDocument();
    expect(screen.queryByText("$245.99")).not.toBeInTheDocument();
  });
});
