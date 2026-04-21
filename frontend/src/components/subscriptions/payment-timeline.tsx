import { History, LoaderCircle, TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { CurrencyDisplay, formatCurrency } from "@/components/ui/currency-display";
import type { SubscriptionPaymentHistory } from "@/types";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type PaymentTimelineProps = {
  history?: SubscriptionPaymentHistory;
  isLoading?: boolean;
};

export function PaymentTimeline({ history, isLoading = false }: PaymentTimelineProps) {
  if (isLoading) {
    return (
      <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
        <div className="flex items-center gap-3 text-sm text-black/58">
          <LoaderCircle className="size-4 animate-spin" />
          Loading payment history...
        </div>
      </section>
    );
  }

  if (!history || history.items.length === 0) {
    return (
      <EmptyState
        description="Payment history will appear here after statement uploads link settled charges to this subscription."
        eyebrow="Payment timeline"
        icon={<History className="size-5" />}
        title="No payment history yet"
      />
    );
  }

  const timelineItems = [
    ...history.items.map((payment) => ({
      id: `payment-${payment.id}`,
      kind: "payment" as const,
      label: payment.payment_method_label || "Imported charge",
      value: formatCurrency({
        currency: payment.currency,
        value: Number(payment.amount),
      }),
      when: payment.paid_at,
    })),
    ...history.price_changes.map((change) => ({
      id: `price-change-${change.id}`,
      kind: "price-change" as const,
      label: change.note || "Price changed",
      value: `${formatCurrency({
        currency: change.currency,
        value: Number(change.previous_amount),
      })} -> ${formatCurrency({
        currency: change.currency,
        value: Number(change.new_amount),
      })}`,
      when: `${change.effective_date}T12:00:00Z`,
    })),
  ].sort((left, right) => new Date(right.when).getTime() - new Date(left.when).getTime());

  return (
    <section className="space-y-6 rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
      <div className="flex flex-col gap-4 border-b border-black/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-black/45">Payment timeline</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Payment history</h2>
          <p className="max-w-2xl text-sm leading-6 text-black/62">
            Lifetime charges and detected price changes are grouped together so billing shifts read
            as one operating log instead of isolated rows.
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-[#101922] px-5 py-4 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-white/46">Lifetime paid</p>
          <CurrencyDisplay
            className="mt-2 block text-3xl font-semibold tracking-tight"
            currency={history.items[0]?.currency || "USD"}
            value={Number(history.summary.total_paid)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.4rem] border border-black/10 bg-stone/65 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Payments</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {history.summary.payment_count}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-black/10 bg-stone/65 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Average charge</p>
          <CurrencyDisplay
            className="mt-3 block text-3xl font-semibold tracking-tight text-ink"
            currency={history.items[0]?.currency || "USD"}
            value={Number(history.summary.average_payment)}
          />
        </div>
        <div className="rounded-[1.4rem] border border-black/10 bg-stone/65 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Latest payment</p>
          <p className="mt-3 text-lg font-semibold text-ink">
            {history.summary.latest_payment_at
              ? formatTimestamp(history.summary.latest_payment_at)
              : "Not available"}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-black/10 bg-stone/65 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Price changes</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {history.summary.price_change_count}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {timelineItems.map((item) => (
          <div
            className="flex flex-col gap-3 rounded-[1.45rem] border border-black/10 bg-white/88 p-4 md:flex-row md:items-center md:justify-between"
            key={item.id}
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-stone text-ink">
                {item.kind === "payment" ? (
                  <History className="size-4" />
                ) : (
                  <TrendingUp className="size-4" />
                )}
              </span>
              <div>
                <p className="text-base font-semibold text-ink">
                  {item.kind === "payment" ? "Settled payment" : "Price change detected"}
                </p>
                <p className="mt-1 text-sm text-black/58">{item.label}</p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-base font-semibold text-ink">{item.value}</p>
              <p className="mt-1 text-sm text-black/52">{formatTimestamp(item.when)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
