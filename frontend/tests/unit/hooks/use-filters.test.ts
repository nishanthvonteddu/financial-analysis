import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFilters } from "@/hooks/use-filters";

const replace = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/subscriptions",
  useRouter: () => ({
    replace,
  }),
  useSearchParams: () => currentSearchParams,
}));

describe("useFilters", () => {
  beforeEach(() => {
    replace.mockReset();
    currentSearchParams = new URLSearchParams();
  });

  it("reads the current URL state into filter values", () => {
    currentSearchParams = new URLSearchParams(
      "search=netflix&status=active&category_id=3&payment_method_id=7&cadence=monthly&min_amount=8&max_amount=25",
    );

    const { result } = renderHook(() => useFilters({ searchDelay: 0 }));

    expect(result.current.filters.search).toBe("netflix");
    expect(result.current.filters.status).toBe("active");
    expect(result.current.filters.categoryId).toBe("3");
    expect(result.current.filters.paymentMethodId).toBe("7");
    expect(result.current.queryFilters.min_amount).toBe(8);
    expect(result.current.queryFilters.max_amount).toBe(25);
  });

  it("syncs filter changes back into the URL", async () => {
    const { result } = renderHook(() => useFilters({ searchDelay: 0 }));

    act(() => {
      result.current.setSearch("hulu");
      result.current.setStatus("paused");
      result.current.setCategoryId("4");
      result.current.setPaymentMethodId("8");
      result.current.setCadence("yearly");
      result.current.setMinAmount("12");
      result.current.setMaxAmount("42");
    });

    await waitFor(() => {
      expect(replace).toHaveBeenLastCalledWith(
        "/subscriptions?cadence=yearly&category_id=4&max_amount=42&min_amount=12&payment_method_id=8&search=hulu&status=paused",
        { scroll: false },
      );
    });
  });
});
