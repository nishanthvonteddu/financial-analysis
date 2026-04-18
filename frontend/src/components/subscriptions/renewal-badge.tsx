import { AlertTriangle, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SubscriptionRenewal } from "@/types";

type RenewalBadgeProps = {
  className?: string;
  renewal: SubscriptionRenewal;
};

function formatDays(value: number) {
  return `${value} day${value === 1 ? "" : "s"}`;
}

export function RenewalBadge({ className, renewal }: RenewalBadgeProps) {
  if (renewal.state === "overdue" && renewal.days_overdue !== null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700",
          className,
        )}
      >
        <AlertTriangle className="size-3.5" />
        Overdue by {formatDays(renewal.days_overdue)}
      </span>
    );
  }

  if (renewal.state === "trialing" && renewal.trial_days_remaining !== null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700",
          className,
        )}
      >
        <Sparkles className="size-3.5" />
        Trial ends in {formatDays(renewal.trial_days_remaining)}
      </span>
    );
  }

  return null;
}
