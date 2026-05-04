import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  action,
  className,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-black/10 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/48 dark:text-white/48">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-6 text-black/62 dark:text-white/62">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
