import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportWorkspace } from "@/components/exports/export-workspace";
import { useExportDownload } from "@/hooks/use-export";

vi.mock("@/hooks/use-export", () => ({
  useExportDownload: vi.fn(),
}));

const mutateAsync = vi.fn();

describe("ExportWorkspace", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({
      blob: new Blob(["export"], { type: "text/csv" }),
      filename: "mysubscription-export.csv",
    });
    vi.mocked(useExportDownload).mockReturnValue({
      isPending: false,
      mutateAsync,
    } as unknown as ReturnType<typeof useExportDownload>);
    window.URL.createObjectURL = vi.fn(() => "blob:export");
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("renders export controls and submits selected options", async () => {
    const user = userEvent.setup();

    render(<ExportWorkspace />);

    expect(screen.getByRole("heading", { name: "Export center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CSV/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /JSON/ }));
    await user.click(screen.getByRole("checkbox", { name: /Active subscriptions/ }));
    await user.selectOptions(screen.getByLabelText("Calendar horizon"), "6");
    await user.click(screen.getByRole("button", { name: "Download export" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        active_only: true,
        calendar_months: 6,
        format: "json",
        include_payment_history: true,
      });
    });
    expect(screen.getByText("mysubscription-export.csv")).toBeInTheDocument();
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:export");
  });

  it("disables the download button while an export is pending", () => {
    vi.mocked(useExportDownload).mockReturnValue({
      isPending: true,
      mutateAsync,
    } as unknown as ReturnType<typeof useExportDownload>);

    render(<ExportWorkspace />);

    expect(screen.getByRole("button", { name: /Download export/ })).toBeDisabled();
  });
});
