import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import type { Subscription } from "@/types";

const subscription: Subscription = {
  amount: "15.49",
  auto_renew: true,
  cadence: "monthly",
  category_id: 1,
  created_at: "2026-04-06T00:00:00Z",
  currency: "USD",
  day_of_month: 1,
  description: "Primary streaming plan",
  end_date: null,
  id: 7,
  name: "Netflix Family",
  next_charge_date: "2026-05-01",
  notes: "Shared with household",
  payment_method_id: 9,
  start_date: "2026-04-01",
  status: "active",
  updated_at: "2026-04-06T00:00:00Z",
  user_id: 1,
  vendor: "Netflix",
  website_url: "https://www.netflix.com",
};

describe("SubscriptionCard", () => {
  it("shows core subscription details and the detail link", () => {
    render(
      <SubscriptionCard
        categoryName="Streaming"
        href="/subscriptions/7"
        paymentMethodLabel="Visa ending in 4242"
        subscription={subscription}
      />,
    );

    expect(screen.getByText("Netflix Family")).toBeVisible();
    expect(screen.getByText("Streaming")).toBeVisible();
    expect(screen.getByText("Paid with Visa ending in 4242")).toBeVisible();
    expect(screen.getByRole("link", { name: /open detail/i })).toHaveAttribute(
      "href",
      "/subscriptions/7",
    );
  });

  it("supports the compact list layout", () => {
    render(<SubscriptionCard subscription={subscription} viewMode="list" />);

    expect(screen.getByText("Renews May 1, 2026")).toBeVisible();
    expect(screen.getByText("$15.49")).toBeVisible();
  });
});
