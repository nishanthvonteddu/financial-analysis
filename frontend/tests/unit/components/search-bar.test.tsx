import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SearchBar } from "@/components/subscriptions/search-bar";
import { render, screen } from "../../../test-utils/render";

describe("SearchBar", () => {
  it("forwards typed values to the change handler", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SearchBar onChange={onChange} value="" />);

    await user.type(screen.getByRole("searchbox"), "net");

    expect(onChange).toHaveBeenCalled();
  });

  it("clears the current search value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SearchBar onChange={onChange} value="Netflix" />);

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onChange).toHaveBeenCalledWith("");
  });
});
