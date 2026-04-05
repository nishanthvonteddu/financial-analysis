import { ArrowRight, BellRing, CalendarClock, Layers3, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

const metricRows = [
  {
    detail: "11 active plans, 3 annual conversions worth reviewing this week.",
    label: "Monthly recurring",
    value: 118.4,
  },
  {
    detail: "The highest renewal cluster lands between April 9 and April 14.",
    label: "Projected next 14 days",
    value: 46.75,
  },
  {
    detail: "Shared spend is stable across household, work, and trial categories.",
    label: "Average plan cost",
    value: 10.76,
  },
];

const renewalQueue = [
  {
    amount: 14.99,
    date: "Apr 9",
    detail: "Streaming bundle • Visa •••• 4109",
    title: "Prime Video + Music",
  },
  {
    amount: 9.99,
    date: "Apr 11",
    detail: "Cloud notes • Mastercard •••• 8221",
    title: "Notion Plus",
  },
  {
    amount: 21,
    date: "Apr 14",
    detail: "Meal planner • Visa •••• 4109",
    title: "Family recipes",
  },
];

const workspaceMoves = [
  "Shared navigation now covers dashboard, subscriptions, payments, calendar, and settings.",
  "The top bar exposes search affordance, notifications, theme control, and user session actions.",
  "Empty states and reusable headers are in place so the next milestones can plug into the shell quickly.",
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        action={
          <Button className="rounded-full px-5" variant="outline">
            Review upcoming charges
            <ArrowRight className="ml-2 size-4" />
          </Button>
        }
        description="A stable operator shell now wraps the authenticated experience, so new milestone work can focus on product behavior instead of rebuilding layout chrome."
        eyebrow="Day 4 workspace"
        title="Subscription command center"
      />

      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white/72 p-6 shadow-line backdrop-blur sm:p-8">
          <div className="flex items-center justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-black/45">Snapshot</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">Recurring spend at a glance</h3>
            </div>
            <WalletCards className="size-5 text-ember" />
          </div>

          <div className="divide-y divide-black/10">
            {metricRows.map((row) => (
              <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto]" key={row.label}>
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.28em] text-black/45">{row.label}</p>
                  <p className="text-sm leading-6 text-black/65">{row.detail}</p>
                </div>
                <CurrencyDisplay
                  className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
                  value={row.value}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-black/10 bg-[#101922] p-6 text-white shadow-[0_24px_80px_rgba(17,20,24,0.22)] sm:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">Attention</p>
              <h3 className="mt-2 text-2xl font-semibold">Renewal watch</h3>
            </div>
            <BellRing className="size-5 text-amber-300" />
          </div>

          <div className="space-y-4">
            {renewalQueue.map((item) => (
              <div
                className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur"
                key={item.title}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-white/62">{item.detail}</p>
                  </div>
                  <p className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/72">
                    {item.date}
                  </p>
                </div>
                <CurrencyDisplay
                  className="mt-4 text-2xl font-semibold text-amber-200"
                  value={item.amount}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white/72 p-6 shadow-line backdrop-blur sm:p-8">
          <div className="flex items-center justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-black/45">Flow</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">This week&apos;s pacing</h3>
            </div>
            <CalendarClock className="size-5 text-ember" />
          </div>

          <div className="divide-y divide-black/10">
            {renewalQueue.map((item) => (
              <div className="grid gap-4 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]" key={item.title}>
                <p className="text-xs uppercase tracking-[0.28em] text-black/45">{item.date}</p>
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-black/60">{item.detail}</p>
                </div>
                <CurrencyDisplay className="text-right font-semibold text-ink" value={item.amount} />
              </div>
            ))}
          </div>
        </div>

        <EmptyState
          action={
            <Button className="rounded-full px-5" variant="outline">
              Open subscriptions surface
            </Button>
          }
          description="The shell is live, but downstream milestone features have not populated this lane yet. Shared headers, empty states, dialogs, and formatting utilities are now ready for those flows."
          eyebrow="Shell readiness"
          icon={<Layers3 className="size-5" />}
          title="The next product surfaces can plug in without layout rework."
        />
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-white/72 p-6 shadow-line backdrop-blur sm:p-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {workspaceMoves.map((move) => (
            <p
              className="border-t border-black/10 pt-4 text-sm leading-6 text-black/65 first:border-t-0 first:pt-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 lg:first:border-l-0 lg:first:pl-0"
              key={move}
            >
              {move}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
