import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PrivacyPage from "@/app/privacy/page";

describe("PrivacyPage", () => {
  it("renders the privacy policy sections", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", {
        name: /Workspace data stays scoped/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Uploads and parsing/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back home/i })).toHaveAttribute("href", "/");
  });
});
