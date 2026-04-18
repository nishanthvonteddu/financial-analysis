import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PaymentTimeline } from "@/components/subscriptions/payment-timeline";
import type { SubscriptionPaymentHistory } from "@/types";

const history: SubscriptionPaymentHistory = {
  items: [
    {
      amount: "18.00",
      currency: "USD",
      id: 3,
      paid_at: "2026-03-05T00:00:00Z",
      payment_method_id: 1,
      payment_method_label: "Primary card",
      payment_status: "settled",
      reference: "nf-3",
    },
    {
      amount: "15.00",
      currency: "USD",
      id: 2,
      paid_at: "2026-02-05T00:00:00Z",
      payment_method_id: 1,
      payment_method_label: "Primary card",
      payment_status: "settled",
      reference: "nf-2",
    },
  ],
  price_changes: [
    {
      currency: "USD",
      effective_date: "2026-03-05",
      id: 9,
      new_amount: "18.00",
      note: "Price changed from 15.00 to 18.00.",
      previous_amount: "15.00",
    },
  ],
  subscription_id: 7,
  subscription_name: "Netflix",
  summary: {
    average_payment: "16.50",
    first_payment_at: "2026-02-05T00:00:00Z",
    latest_payment_amount: "18.00",
    latest_payment_at: "2026-03-05T00:00:00Z",
    payment_count: 2,
    price_change_count: 1,
    total_paid: "33.00",
  },
};

describe("PaymentTimeline", () => {
  it("renders summary metrics and timeline entries", () => {
    render(<PaymentTimeline history={history} />);

    expect(screen.getByText("Payment history")).toBeVisible();
    expect(screen.getByText("$33.00")).toBeVisible();
    expect(screen.getByText("Price change detected")).toBeVisible();
    expect(screen.getAllByText("Settled payment")).toHaveLength(2);
    expect(screen.getByText("$15.00 -> $18.00")).toBeVisible();
  });

  it("shows the empty state when no history is present", () => {
    render(<PaymentTimeline history={{ ...history, items: [], price_changes: [] }} />);

    expect(screen.getByText("No payment history yet")).toBeVisible();
  });
});
