import { ArrowUpRight, BellRing, CalendarClock, WalletCards } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

const dashboardRows = [
  {
    label: "Upcoming renewal",
    value: "April 9",
    detail: "Streaming bundle billed from Visa •••• 4109",
    icon: CalendarClock,
  },
  {
    label: "Monthly recurring",
    value: "$118.40",
    detail: "11 active plans across work, home, and trials",
    icon: WalletCards,
  },
  {
    label: "Next alert",
    value: "2 days",
    detail: "Renewal reminder queued before the next charge posts",
    icon: BellRing,
  },
];

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(234,239,242,0.8)),hsl(var(--background))] px-6 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-8 border-b border-black/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.34em] text-black/45">
                Protected dashboard
              </p>
              <h1 className="font-serif text-5xl leading-none text-ink sm:text-6xl">
                See the next renewal before it lands.
              </h1>
              <p className="max-w-xl text-base leading-7 text-black/65">
                Authentication is now active, the route is protected, and the next milestones can
                build directly on a live session-aware shell.
              </p>
            </div>

            <Button className="rounded-full px-6">
              Review subscriptions
              <ArrowUpRight className="ml-2 size-4" />
            </Button>
          </header>

          <section className="grid gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5 border-b border-black/10 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
              <p className="text-sm uppercase tracking-[0.3em] text-black/45">Session state</p>
              <h2 className="text-3xl font-semibold text-ink">Authenticated and ready for day 3.</h2>
              <p className="max-w-lg text-base leading-7 text-black/65">
                The access token refreshes in memory, unauthenticated users are redirected, and the
                app now has a stable gate for the CRUD work that follows.
              </p>
            </div>

            <div className="divide-y divide-black/10">
              {dashboardRows.map(({ detail, icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 py-5 first:pt-0">
                  <Icon className="mt-1 size-5 text-ember" />
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-[0.25em] text-black/45">{label}</p>
                    <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-black/60">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
