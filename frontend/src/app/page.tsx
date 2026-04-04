import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CalendarRange, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const proofPoints = [
  "Catalog monthly and yearly plans in one view",
  "Prepare alerts before renewal dates arrive",
  "Keep backend and UI bootstrap ready for the next milestones",
];

const systemAreas = [
  {
    label: "Day 1 scope",
    value: "Bootstrap",
  },
  {
    label: "Core surfaces",
    value: "API, theme, tests",
  },
  {
    label: "Infra",
    value: "CI, Docker, Make",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-screen border-b border-black/10 bg-mesh">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
          <header className="flex items-center justify-between py-2">
            <div>
              <p className="font-serif text-2xl tracking-tight text-ink">MySubscription Tracker</p>
              <p className="text-sm uppercase tracking-[0.3em] text-black/45">Day 1 foundation</p>
            </div>
            <Button variant="ghost" className="rounded-full border border-black/10 px-5">
              Preview shell
            </Button>
          </header>

          <div className="grid gap-12 pb-10 pt-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)] lg:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm uppercase tracking-[0.28em] text-black/45">
                Calm control for recurring spend
              </p>
              <h1 className="max-w-xl font-serif text-5xl leading-none text-ink sm:text-6xl lg:text-7xl">
                Track every subscription before it quietly tracks you.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-black/68">
                The first milestone establishes the product shell, data layer, CI pipelines, and
                a composed front door for the app.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild className="rounded-full px-6">
                  <Link href="/register">
                    Create account
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-black/15 bg-white/70 px-6">
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>

            <div className="relative border-l border-black/10 pl-8">
              <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-black/30 to-transparent" />
              <div className="space-y-6">
                {systemAreas.map((item) => (
                  <div key={item.label} className="pb-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-black/45">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-black/45">Core proof</p>
          <h2 className="mt-4 max-w-lg font-serif text-4xl leading-tight text-ink">
            One milestone, four foundation tracks.
          </h2>
        </div>
        <ul className="space-y-5 border-t border-black/10 pt-4 text-lg text-black/70 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
          {proofPoints.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 size-2 rounded-full bg-ember" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-black/10 bg-white/55">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-18 sm:px-10 lg:grid-cols-3 lg:px-12">
          <article className="space-y-5 border-b border-black/10 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <BadgeDollarSign className="size-6 text-ember" />
            <h3 className="text-2xl font-semibold text-ink">Subscription clarity</h3>
            <p className="text-black/65">
              Backend models and API contracts are ready for recurring products, payment methods,
              and future reporting.
            </p>
          </article>
          <article className="space-y-5 border-b border-black/10 pb-8 lg:border-b-0 lg:border-r lg:px-6 lg:pb-0">
            <CalendarRange className="size-6 text-ember" />
            <h3 className="text-2xl font-semibold text-ink">Renewal awareness</h3>
            <p className="text-black/65">
              Query, theme, and test providers create the stable client shell the rest of the
              journey will build on.
            </p>
          </article>
          <article className="space-y-5 lg:pl-6">
            <ShieldCheck className="size-6 text-ember" />
            <h3 className="text-2xl font-semibold text-ink">Operational guardrails</h3>
            <p className="text-black/65">
              Docker, workflows, and scripts define the baseline checks needed before feature work
              accelerates.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
