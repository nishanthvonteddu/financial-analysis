import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/ui/theme-toggle";

const setTheme = vi.fn();
let resolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme,
    setTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    resolvedTheme = "light";
    setTheme.mockReset();
  });

  it("switches from light mode to dark mode", async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    await user.click(await screen.findByRole("button", { name: /switch to dark mode/i }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches from dark mode to light mode", async () => {
    const user = userEvent.setup();
    resolvedTheme = "dark";

    render(<ThemeToggle />);

    await user.click(await screen.findByRole("button", { name: /switch to light mode/i }));

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
