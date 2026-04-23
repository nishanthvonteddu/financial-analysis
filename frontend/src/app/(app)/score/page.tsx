"use client";

import Link from "next/link";
import { ArrowRight, Gauge, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useDashboardScore } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import type { DashboardScoreBand } from "@/types";

function formatBandLabel(value: DashboardScoreBand) {
  if (value === "excellent") {
    return "Excellent";
  }
  if (value === "steady") {
    return "Steady";
  }
  if (value === "attention") {
    return "Needs attention";
  }
  return "At risk";
}

function GaugeRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 82;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex size-56 items-center justify-center">
      <svg className="-rotate-90" height="224" viewBox="0 0 224 224" width="224">
        <circle
          cx="112"
          cy="112"
          fill="none"
          r="82"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="18"
        />
        <circle
          cx="112"
          cy="112"
          fill="none"
          r="82"
          stroke="#dc5d30"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth="18"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-6xl font-semibold tracking-tight text-white">{score}</p>
        <p className="mt-2 text-sm uppercase tracking-[0.32em] text-white/48">Current score</p>
      </div>
    </div>
  );
}

export default function ScorePage() {
  const scoreQuery = useDashboardScore();
  const score = scoreQuery.data;

  if (scoreQuery.isLoading && !score) {
    return (
      <div className="space-y-8 animate-page-enter">
        <PageHeader
          description="Loading the latest score, duplicate watchlist, and recommended cleanup moves."
          eyebrow="Subscription score"
          title="Portfolio health"
        />
        <div className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-8">
          <div className="flex items-center gap-3 text-sm text-black/58">
            <LoaderCircle className="size-4 animate-spin" />
            Loading subscription score...
          </div>
        </div>
      </div>
    );
  }

  if (!score || score.active_subscription_count === 0) {
    return (
      <div className="space-y-8 animate-page-enter">
        <PageHeader
          action={
            <Button asChild className="rounded-full px-5" variant="outline">
              <Link href="/subscriptions">
                Open subscriptions
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          }
          description="The score activates after the workspace has at least one live subscription to inspect."
          eyebrow="Subscription score"
          title="Portfolio health"
        />
        <EmptyState
          action={
            <Button asChild className="rounded-full px-5" variant="outline">
              <Link href="/subscriptions">Add the first subscription</Link>
            </Button>
          }
          description="Once active plans exist, this page will grade coverage, renewal readiness, context, and duplicate risk."
          icon={<Gauge className="size-5" />}
          title="No active subscriptions to score yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/subscriptions">
              Review subscriptions
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="Grade the live subscription portfolio, surface the sharpest duplicate overlaps, and keep the next cleanup action explicit."
        eyebrow="Subscription score"
        title="Portfolio health"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
        <section className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#101922] p-6 text-white shadow-[0_24px_80px_rgba(17,20,24,0.22)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.82fr)_minmax(0,1.18fr)] lg:items-center">
              <div className="flex justify-center lg:justify-start">
                <GaugeRing score={score.score} />
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-white/45">Overall grade</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                    {score.grade} · {formatBandLabel(score.band)}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/68">
                    The score blends portfolio coverage, renewal readiness, service context, and duplicate pressure across the current active subscriptions.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">Active plans</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">{score.active_subscription_count}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">Potential savings</p>
                    <CurrencyDisplay
                      className="mt-3 block text-2xl font-semibold tracking-tight"
                      currency={score.currency}
                      value={Number.parseFloat(score.potential_monthly_savings)}
                    />
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">Duplicate candidates</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">{score.duplicate_candidates.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex flex-col gap-3 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-black/45">Breakdown</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Where the score is moving</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-black/58">
                Each lane contributes up to 25 points so cleanup effort stays comparable instead of vague.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {score.breakdown.map((item) => {
                const progress = `${(item.score / item.max_score) * 100}%`;

                return (
                  <div className="rounded-[1.45rem] border border-black/10 bg-white/80 p-5" key={item.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-black/42">{item.label}</p>
                        <p className="mt-3 text-sm leading-6 text-black/58">{item.detail}</p>
                      </div>
                      <div className="rounded-full border border-black/10 bg-stone/70 px-3 py-2 text-sm font-semibold text-ink">
                        {item.score}/{item.max_score}
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8">
                      <div className="h-full rounded-full bg-[#dc5d30]" style={{ width: progress }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-black/42">Recommendations</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Next actions</h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {score.recommendations.map((item) => (
                <div className="rounded-[1.45rem] border border-black/10 bg-white/84 p-5" key={item.title}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-ink">{item.title}</p>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
                            item.priority === "high"
                              ? "bg-[#101922] text-white"
                              : item.priority === "medium"
                                ? "bg-stone text-ink"
                                : "bg-black/6 text-black/58",
                          )}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">{item.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {item.potential_monthly_savings ? (
                        <div className="rounded-full border border-black/10 bg-stone/70 px-4 py-2 text-sm text-ink">
                          <CurrencyDisplay
                            className="font-semibold"
                            currency={item.currency ?? score.currency}
                            value={Number.parseFloat(item.potential_monthly_savings)}
                          />
                        </div>
                      ) : null}
                      {item.action_href && item.action_label ? (
                        <Button asChild className="rounded-full px-4" size="sm" variant="outline">
                          <Link href={item.action_href}>{item.action_label}</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-black/10 bg-white/76 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-black/42">Duplicate watchlist</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Possible overlap pairs</h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {score.duplicate_candidates.length === 0 ? (
                <div className="rounded-[1.45rem] border border-dashed border-black/12 bg-white/70 p-5 text-sm leading-6 text-black/58">
                  No strong overlap pairs are active right now. The waste-control lane will stay high until duplicate pressure returns.
                </div>
              ) : (
                score.duplicate_candidates.map((item) => (
                  <div
                    className="rounded-[1.45rem] border border-black/10 bg-white/84 p-5"
                    key={`${item.left_subscription_id}-${item.right_subscription_id}`}
                  >
                    <p className="text-base font-semibold text-ink">
                      {item.left_name} + {item.right_name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/58">
                      {item.left_vendor} · {item.shared_signal} · {item.confidence} confidence
                    </p>
                    <CurrencyDisplay
                      className="mt-4 block text-xl font-semibold tracking-tight text-ink"
                      currency={item.currency}
                      value={Number.parseFloat(item.potential_monthly_savings)}
                    />
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-black/42">
                      Potential monthly savings
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#101922] p-6 text-white shadow-[0_24px_80px_rgba(17,20,24,0.22)] sm:p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">How to read it</p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              Coverage and renewal lanes reward clean billing metadata. Context rewards service URLs and notes. Waste control stays high when duplicate overlap is low.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
