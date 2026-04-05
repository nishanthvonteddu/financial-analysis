import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CurrencyDisplay, formatCurrency } from "@/components/ui/currency-display";

describe("CurrencyDisplay", () => {
  it("renders standard USD currency formatting", () => {
    render(<CurrencyDisplay value={118.4} />);

    expect(screen.getByText("$118.40")).toBeInTheDocument();
  });

  it("supports signed and compact formatting", () => {
    render(
      <CurrencyDisplay compact maximumFractionDigits={1} showSign value={7400} />,
    );

    expect(screen.getByText(formatCurrency({ compact: true, maximumFractionDigits: 1, showSign: true, value: 7400 }))).toBeInTheDocument();
  });
});
