"use client";

import type { ReactNode } from "react";
import { GripVertical, MoveHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

type WidgetContainerProps = {
  children: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  onToggleColumn?: () => void;
  title: string;
};

export function WidgetContainer({
  children,
  className,
  description,
  eyebrow,
  onToggleColumn,
  title,
}: WidgetContainerProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,241,232,0.76))] p-5 shadow-line backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-black/18",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">{eyebrow}</p>
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-ink">{title}</h3>
            <p className="max-w-xl text-sm leading-6 text-black/62">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleColumn ? (
            <button
              aria-label={`Move ${title} to the other column`}
              className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white/72 text-black/60 transition hover:border-black/18 hover:text-ink"
              onClick={onToggleColumn}
              type="button"
            >
              <MoveHorizontal className="size-4" />
            </button>
          ) : null}
          <button
            aria-label={`Drag ${title} widget`}
            className="dashboard-grid-handle inline-flex size-10 cursor-grab items-center justify-center rounded-full border border-black/10 bg-[#101922] text-white/76 transition hover:bg-[#111a24] active:cursor-grabbing"
            type="button"
          >
            <GripVertical className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 pt-5">{children}</div>
    </article>
  );
}
