import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
};

export function EmptyState({
  action,
  className,
  description,
  icon,
  eyebrow,
  title,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-black/10 bg-white p-6 shadow-line sm:p-7",
        className,
      )}
    >
      <div className="max-w-xl space-y-4">
        {icon ? (
          <div className="inline-flex size-11 items-center justify-center rounded-lg border border-black/10 bg-stone text-ink">
            {icon}
          </div>
        ) : null}
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48">{eyebrow}</p>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <p className="text-sm leading-6 text-black/62">{description}</p>
        </div>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </section>
  );
}
