import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders the custom 404 copy", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", {
        name: /The route you asked for is outside the current subscription workspace/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
