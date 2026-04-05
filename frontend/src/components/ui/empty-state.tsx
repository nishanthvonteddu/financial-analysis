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
        "rounded-[2rem] border border-black/10 bg-white/72 p-6 shadow-line backdrop-blur sm:p-8",
        className,
      )}
    >
      <div className="max-w-xl space-y-4">
        {icon ? (
          <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-black/10 bg-stone text-ink">
            {icon}
          </div>
        ) : null}
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.32em] text-black/45">{eyebrow}</p>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-ink">{title}</h3>
          <p className="text-base leading-7 text-black/65">{description}</p>
        </div>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </section>
  );
}
