import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Radar,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const featureStrip = [
  "Manual subscription control with searchable filters",
  "CSV and PDF imports with live processing status",
  "Persistent dashboards, settings, and onboarding guidance",
];

const steps = [
  {
    body: "Start with manual entry or drag in a bank export. The workspace keeps source files, queue state, and plan details in one operating surface.",
    label: "01",
    title: "Bring your billing data in",
  },
  {
    body: "The parser normalizes uploads, the detection engine spots recurring charges, and the app keeps the resulting changes visible instead of burying them.",
    label: "02",
    title: "Let the system detect patterns",
  },
  {
    body: "Review active plans, next charges, category mix, and payment rails without hopping between disconnected admin pages.",
    label: "03",
    title: "Operate from one dashboard",
  },
  {
    body: "Adjust categories, payment methods, theme, and workspace defaults as the product moves from MVP into the full platform roadmap.",
    label: "04",
    title: "Tighten the workspace over time",
  },
];

const productEdges = [
  {
    body: "Recurring plans, payment rails, and lifecycle changes stay editable without leaving the authenticated shell.",
    icon: Sparkles,
    title: "Subscription command surface",
  },
  {
    body: "Statement files move through upload, parsing, and detection with progress visibility instead of silent background jobs.",
    icon: Upload,
    title: "Observable statement ingestion",
  },
  {
    body: "Dashboard widgets, settings, and session flows keep the MVP usable now while the later milestones layer on analytics and automation.",
    icon: Radar,
    title: "Built for the next milestone",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[100svh] overflow-hidden border-b border-black/10 bg-[linear-gradient(160deg,rgba(250,246,240,0.96),rgba(231,238,244,0.84)_42%,rgba(247,239,228,0.92))] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(253,180,118,0.16),transparent_24%),linear-gradient(155deg,rgba(10,18,26,0.98),rgba(16,24,35,0.92)_45%,rgba(29,17,9,0.82))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(220,93,48,0.18),transparent_20%),radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.76),transparent_20%)] dark:bg-[radial-gradient(circle_at_78%_22%,rgba(255,151,90,0.14),transparent_18%),radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_18%)]" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col px-6 pb-12 pt-6 sm:px-10 lg:px-12">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-2xl tracking-tight text-ink dark:text-white">
                MySubscription Tracker
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.34em] text-black/48 dark:text-white/45">
                Day 15 MVP wrap
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild className="rounded-full px-5" variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/register">
                  Create account
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </header>

          <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(360px,0.96fr)] lg:items-end lg:py-14">
            <div className="max-w-2xl self-center">
              <p className="animate-page-enter text-sm uppercase tracking-[0.32em] text-black/48 dark:text-white/52">
                Calm control for recurring spend
              </p>
              <h1 className="animate-page-enter mt-5 max-w-3xl font-serif text-5xl leading-[0.94] text-ink sm:text-6xl lg:text-7xl dark:text-white">
                See every renewal coming before it turns into background spend.
              </h1>
              <p className="animate-page-enter-delayed mt-6 max-w-xl text-lg leading-8 text-black/68 dark:text-white/68">
                Track subscriptions, ingest statement files, review dashboard signals, and keep the
                MVP workspace polished enough to operate every week instead of revisiting once a quarter.
              </p>

              <div className="animate-page-enter-delayed mt-8 flex flex-wrap gap-4">
                <Button asChild className="rounded-full px-6">
                  <Link href="/register">
                    Start the workspace
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild className="rounded-full border-black/10 bg-white/78 px-6 dark:border-white/10 dark:bg-white/10 dark:text-white" variant="outline">
                  <Link href="/dashboard">Preview the app shell</Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 border-t border-black/10 pt-6 text-sm text-black/62 dark:border-white/10 dark:text-white/62 sm:grid-cols-3">
                {featureStrip.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="relative min-h-[28rem] overflow-hidden rounded-[2.8rem] border border-black/10 bg-[#101922] p-6 text-white shadow-[0_30px_120px_rgba(17,20,24,0.22)] sm:p-8 dark:border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,202,173,0.22),transparent_22%),radial-gradient(circle_at_18%_88%,rgba(220,93,48,0.26),transparent_30%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">Live surface</p>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-white/68">
                      Imports, filters, layout persistence, and workspace defaults are already in the
                      MVP. Day 15 tightens the front door around them.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/12 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/55">
                    MVP ready
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2 border-b border-white/10 pb-5">
                    <p className="text-[11px] uppercase tracking-[0.34em] text-white/42">
                      Import. Detect. Decide.
                    </p>
                    <p className="max-w-md text-4xl font-semibold leading-tight sm:text-5xl">
                      One workspace for what is active, what is due next, and what is quietly drifting upward.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3 border-b border-white/10 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                      <div className="flex items-center justify-between text-sm text-white/64">
                        <span>Uploads + parsing</span>
                        <span>Live</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full w-[72%] rounded-full bg-[#f4caad]" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-white/64">
                        <span>Dashboard widgets</span>
                        <span>Live</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full w-[86%] rounded-full bg-white/70" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3">
                        <CalendarCheck2 className="size-4 text-[#f4caad]" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-white/42">Renewals</p>
                          <p className="text-sm text-white/74">Keep the next charge visible.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3">
                        <ShieldCheck className="size-4 text-[#f4caad]" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-white/42">Guardrails</p>
                          <p className="text-sm text-white/74">Scoped settings, logs, and safer defaults.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-5 text-sm text-white/52">
                  <span>Imports, subscriptions, dashboard, settings</span>
                  <span>Designed to keep the next move obvious</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/45 dark:text-white/45">
              Features
            </p>
            <h2 className="mt-4 max-w-md font-serif text-4xl leading-tight text-ink dark:text-white">
              An MVP that already behaves like a working tool.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {productEdges.map(({ body, icon: Icon, title }) => (
              <article
                className="group border-t border-black/10 pt-5 transition-transform duration-300 hover:-translate-y-1 dark:border-white/10"
                key={title}
              >
                <div className="inline-flex size-12 items-center justify-center rounded-[1.25rem] border border-black/10 bg-stone text-ink transition group-hover:border-black/20 group-hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:group-hover:border-white/18 dark:group-hover:bg-white/14">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-tight text-ink dark:text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-black/64 dark:text-white/64">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white/58 dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.32em] text-black/45 dark:text-white/45">
              How it works
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-ink dark:text-white">
              Move from raw billing noise to a clean recurring-spend signal.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {steps.map((step) => (
              <article
                className="grid gap-4 border-t border-black/10 py-5 dark:border-white/10 sm:grid-cols-[72px_minmax(0,1fr)]"
                key={step.label}
              >
                <p className="text-4xl font-semibold tracking-tight text-black/25 dark:text-white/22">
                  {step.label}
                </p>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-black/64 dark:text-white/64">
                    {step.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="overflow-hidden rounded-[2.8rem] border border-black/10 bg-[#101922] px-6 py-8 text-white shadow-[0_30px_120px_rgba(17,20,24,0.18)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">Start the MVP</p>
              <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight text-white sm:text-5xl">
                Open the workspace, add the first plan, and make the next renewal impossible to miss.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/68">
                The core flows are already in place. Day 15 turns the shell into a sharper product surface and
                closes the MVP with cleaner errors, stronger polish, and safer defaults.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button asChild className="rounded-full px-6">
                <Link href="/register">
                  Create account
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild className="rounded-full border-white/12 bg-white/10 px-6 text-white hover:bg-white/14" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
