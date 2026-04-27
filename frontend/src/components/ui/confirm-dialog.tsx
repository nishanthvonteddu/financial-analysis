"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  tone?: "default" | "danger";
};

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = "default",
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/48 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        aria-describedby="confirm-dialog-description"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-md animate-page-enter rounded-2xl border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(17,20,24,0.24)] dark:border-white/10 dark:bg-[#101922] sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-black/45 dark:text-white/45">
            Confirm action
          </p>
          <h3
            className="text-2xl font-semibold text-ink dark:text-white"
            id="confirm-dialog-title"
          >
            {title}
          </h3>
          <p
            className="text-base leading-7 text-black/65 dark:text-white/62"
            id="confirm-dialog-description"
          >
            {description}
          </p>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            ref={cancelButtonRef}
            type="button"
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <Button
            className={cn(tone === "danger" && "bg-ember text-white hover:bg-ember/92")}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
