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
        "flex flex-col gap-5 border-b border-black/10 pb-6 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-3">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.22em] text-black/45 dark:text-white/45">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-semibold tracking-tight text-ink dark:text-white sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-xl text-base leading-7 text-black/65 dark:text-white/62">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
