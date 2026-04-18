import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";

import { RenewalBadge } from "@/components/subscriptions/renewal-badge";
import { StatusBadge } from "@/components/subscriptions/status-badge";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/types";

type SubscriptionCardProps = {
  categoryName?: string;
  href?: string;
  paymentMethodLabel?: string;
  subscription: Subscription;
  viewMode?: "grid" | "list";
};

function formatDate(value: string | null) {
  if (!value) {
    return "No date set";
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function getHostLabel(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SubscriptionCard({
  categoryName,
  href,
  paymentMethodLabel,
  subscription,
  viewMode = "grid",
}: SubscriptionCardProps) {
  const hostLabel = getHostLabel(subscription.website_url);
  const amount = Number(subscription.amount);

  return (
    <article
      className={cn(
        "rounded-[2rem] border border-black/10 bg-white/72 p-5 shadow-line backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:bg-white",
        viewMode === "list" && "flex flex-col gap-5 md:flex-row md:items-center md:p-4",
      )}
      data-view-mode={viewMode}
      style={{ contentVisibility: "auto" }}
    >
      <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-[#101922] text-lg font-semibold text-white">
        {subscription.name.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-black/42">
              {categoryName ?? "Uncategorized"}
            </p>
            <div>
              <h3 className="truncate text-xl font-semibold text-ink">{subscription.name}</h3>
              <p className="truncate text-sm text-black/58">{subscription.vendor}</p>
            </div>
          </div>

          <div className="shrink-0 text-left md:text-right">
            <CurrencyDisplay
              className="text-2xl font-semibold text-ink"
              currency={subscription.currency}
              value={Number.isFinite(amount) ? amount : 0}
            />
            <p className="mt-1 text-sm capitalize text-black/48">{subscription.cadence} billing</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-black/58">
          <StatusBadge status={subscription.status} />
          <RenewalBadge renewal={subscription.renewal} />
          <span>Renews {formatDate(subscription.next_charge_date ?? subscription.start_date)}</span>
          {subscription.renewal.last_renewed_at ? (
            <span>Last renewed {formatDate(subscription.renewal.last_renewed_at)}</span>
          ) : null}
          {paymentMethodLabel ? <span>Paid with {paymentMethodLabel}</span> : null}
          {hostLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="size-4" />
              {hostLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <p className="line-clamp-2 text-sm leading-6 text-black/62">
            {subscription.notes || subscription.description || "Manual plan entry ready for lifecycle edits and detail review."}
          </p>

          {href ? (
            <Button asChild className="shrink-0 rounded-full px-4" size="sm" variant="ghost">
              <Link href={href}>
                Open detail
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
