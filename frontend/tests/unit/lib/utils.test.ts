import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes predictably", () => {
    expect(cn("px-3 text-sm", "px-6")).toBe("text-sm px-6");
  });
});
