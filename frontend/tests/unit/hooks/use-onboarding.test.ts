import { act, render as rtlRender } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OnboardingProvider } from "@/components/providers/onboarding-provider";
import { useOnboarding } from "@/hooks/use-onboarding";

function OnboardingHarness() {
  const { completeOnboarding, isComplete, preferredCurrency, setPreferredCurrency } = useOnboarding();

  return createElement(
    "div",
    null,
    createElement("p", { "data-testid": "currency" }, preferredCurrency),
    createElement("p", { "data-testid": "complete" }, isComplete ? "complete" : "incomplete"),
    createElement(
      "button",
      {
        onClick: () => setPreferredCurrency("eur"),
        type: "button",
      },
      "Set currency",
    ),
    createElement(
      "button",
      {
        onClick: () => completeOnboarding("gbp"),
        type: "button",
      },
      "Complete",
    ),
  );
}

describe("useOnboarding", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("requires an onboarding provider", () => {
    expect(() => rtlRender(createElement(OnboardingHarness))).toThrow(
      "useOnboarding must be used within OnboardingProvider.",
    );
  });

  it("restores persisted preferences after hydration", async () => {
    window.localStorage.setItem(
      "mysubscription.onboarding",
      JSON.stringify({
        completedAt: "2026-04-15T16:30:00.000Z",
        preferredCurrency: "cad",
      }),
    );

    const { getByTestId } = rtlRender(
      createElement(OnboardingProvider, null, createElement(OnboardingHarness)),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId("currency")).toHaveTextContent("CAD");
    expect(getByTestId("complete")).toHaveTextContent("complete");
  });

  it("updates the stored currency and completion flag", async () => {
    const { getByRole, getByTestId } = rtlRender(
      createElement(OnboardingProvider, null, createElement(OnboardingHarness)),
    );

    await act(async () => {
      getByRole("button", { name: "Set currency" }).click();
    });

    expect(getByTestId("currency")).toHaveTextContent("EUR");

    await act(async () => {
      getByRole("button", { name: "Complete" }).click();
    });

    expect(getByTestId("currency")).toHaveTextContent("GBP");
    expect(getByTestId("complete")).toHaveTextContent("complete");
    expect(window.localStorage.getItem("mysubscription.onboarding")).toContain("\"preferredCurrency\":\"GBP\"");
  });
});
