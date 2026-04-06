import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@/components/subscriptions/status-badge";

describe("StatusBadge", () => {
  it("renders a readable label for active subscriptions", () => {
    render(<StatusBadge status="active" />);

    expect(screen.getByText("Active")).toBeVisible();
    expect(screen.getByText("Active")).toHaveAttribute("data-status", "active");
  });

  it("normalizes paused and cancelled states", () => {
    render(
      <div>
        <StatusBadge status="paused" />
        <StatusBadge status="cancelled" />
      </div>,
    );

    expect(screen.getByText("Paused")).toBeVisible();
    expect(screen.getByText("Cancelled")).toBeVisible();
  });
});
