import { describe, expect, it } from "vitest";

import {
  buildSubscriptionFormValues,
  subscriptionFormSchema,
  toSubscriptionPayload,
} from "@/lib/validators";

describe("subscription validators", () => {
  it("accepts a valid manual entry payload and normalizes it for the API", () => {
    const parsed = subscriptionFormSchema.parse({
      amount: "15.4",
      auto_renew: true,
      cadence: "monthly",
      category_id: "3",
      currency: "usd",
      day_of_month: "1",
      description: "Primary streaming plan",
      end_date: "",
      name: "Netflix",
      next_charge_date: "2026-05-01",
      notes: "Family plan",
      payment_method_id: "9",
      start_date: "2026-04-01",
      status: "active",
      vendor: "Netflix",
      website_url: "https://www.netflix.com",
    });

    expect(toSubscriptionPayload(parsed)).toEqual({
      amount: "15.40",
      auto_renew: true,
      cadence: "monthly",
      category_id: 3,
      currency: "USD",
      day_of_month: 1,
      description: "Primary streaming plan",
      name: "Netflix",
      next_charge_date: "2026-05-01",
      notes: "Family plan",
      payment_method_id: 9,
      start_date: "2026-04-01",
      status: "active",
      vendor: "Netflix",
      website_url: "https://www.netflix.com",
    });
  });

  it("rejects invalid website URLs", () => {
    const result = subscriptionFormSchema.safeParse({
      amount: "9.99",
      auto_renew: true,
      cadence: "monthly",
      category_id: "",
      currency: "USD",
      day_of_month: "",
      description: "",
      end_date: "",
      name: "Spotify",
      next_charge_date: "",
      notes: "",
      payment_method_id: "",
      start_date: "2026-04-01",
      status: "active",
      vendor: "Spotify",
      website_url: "notaurl",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.website_url).toContain("Enter a valid URL.");
  });

  it("rejects end dates before the start date", () => {
    const result = subscriptionFormSchema.safeParse({
      amount: "9.99",
      auto_renew: true,
      cadence: "monthly",
      category_id: "",
      currency: "USD",
      day_of_month: "",
      description: "",
      end_date: "2026-03-01",
      name: "Spotify",
      next_charge_date: "",
      notes: "",
      payment_method_id: "",
      start_date: "2026-04-01",
      status: "active",
      vendor: "Spotify",
      website_url: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.end_date).toContain(
      "End date must be on or after the start date.",
    );
  });

  it("uses the preferred currency when building a new subscription draft", () => {
    const draft = buildSubscriptionFormValues(undefined, "eur");

    expect(draft.currency).toBe("EUR");
  });
});
