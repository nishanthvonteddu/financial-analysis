import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import type { CalendarRenewalResponse } from "@/types";

const calendar: CalendarRenewalResponse = {
  days: Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    const date = `2026-05-${String(day).padStart(2, "0")}`;

    return {
      date,
      day,
      renewals:
        day === 12
          ? [
              {
                amount: "15.00",
                cadence: "monthly",
                category_id: 1,
                category_name: "Entertainment",
                currency: "USD",
                name: "Netflix",
                payment_method_id: 4,
                payment_method_label: "Primary Card",
                renewal_date: date,
                status: "active",
                subscription_id: 7,
                vendor: "Netflix",
              },
              {
                amount: "9.99",
                cadence: "monthly",
                category_id: 2,
                category_name: "Productivity",
                currency: "USD",
                name: "Dropbox",
                payment_method_id: null,
                payment_method_label: null,
                renewal_date: date,
                status: "active",
                subscription_id: 8,
                vendor: "Dropbox",
              },
            ]
          : [],
      total_amount: day === 12 ? "24.99" : "0.00",
    };
  }),
  month: 5,
  period_end: "2026-05-31",
  period_start: "2026-05-01",
  total_renewals: 2,
  year: 2026,
};

describe("CalendarWorkspace", () => {
  it("renders the month grid with renewal markers", () => {
    render(
      <CalendarWorkspace
        calendar={calendar}
        onMonthChange={vi.fn()}
        selectedMonth={new Date(2026, 4, 1)}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "May 2026" })).toBeInTheDocument();
    expect(screen.getByText("2 projected renewals in this month.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "May 12: 2 renewals" })).toBeInTheDocument();
  });

  it("shows the selected-day popover and detail list", () => {
    render(
      <CalendarWorkspace
        calendar={calendar}
        onMonthChange={vi.fn()}
        selectedMonth={new Date(2026, 4, 1)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "May 12: 2 renewals" }));

    const popover = screen.getByRole("dialog", {
      name: "Renewals for Tuesday, May 12, 2026",
    });
    expect(within(popover).getByText("Netflix")).toBeInTheDocument();
    expect(within(popover).getByText("$15.00")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "2 renewals" })).toBeInTheDocument();
    expect(screen.getByText("Primary Card")).toBeInTheDocument();
  });

  it("requests adjacent months from the controls", () => {
    const onMonthChange = vi.fn();

    render(
      <CalendarWorkspace
        calendar={calendar}
        onMonthChange={onMonthChange}
        selectedMonth={new Date(2026, 4, 1)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 5, 1));
  });
});
