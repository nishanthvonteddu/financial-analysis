import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("holds the previous value until the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: "net" },
    });

    rerender({ value: "netflix" });

    expect(result.current).toBe("net");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("netflix");
  });
});
