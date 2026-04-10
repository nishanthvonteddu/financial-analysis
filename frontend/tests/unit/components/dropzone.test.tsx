import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UploadDropzone } from "@/components/uploads/upload-dropzone";

describe("UploadDropzone", () => {
  it("accepts supported CSV files and forwards upload progress", async () => {
    const user = userEvent.setup();
    let resolveUpload: (() => void) | undefined;
    const onUpload = vi.fn((_file: File, onProgress: (progress: number) => void) => {
      onProgress(64);
      return new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });
    });

    render(<UploadDropzone onUpload={onUpload} />);

    const input = screen.getByLabelText("Upload statement");
    const file = new File(["Posting Date,Details,Amount"], "statement.csv", {
      type: "text/csv",
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1);
    });
    expect(onUpload).toHaveBeenCalledWith(file, expect.any(Function));
    expect(screen.getByText(/statement\.csv ready to process/i)).toBeInTheDocument();
    expect(screen.getByText("64%")).toBeInTheDocument();

    await act(async () => {
      resolveUpload?.();
    });
  });

  it("rejects unsupported file types before upload", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onUpload = vi.fn();

    render(<UploadDropzone onUpload={onUpload} />);

    const input = screen.getByLabelText("Upload statement");
    const file = new File(["hello"], "statement.txt", {
      type: "text/plain",
    });

    await user.upload(input, file);

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Only CSV and PDF uploads are supported.");
  });

  it("rejects files larger than ten megabytes", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();

    render(<UploadDropzone onUpload={onUpload} />);

    const input = screen.getByLabelText("Upload statement");
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf", {
      type: "application/pdf",
    });

    await user.upload(input, file);

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Uploaded file exceeds the 10 MB limit.");
  });
});
