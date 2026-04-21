"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Clock3, Landmark, PiggyBank, TrendingUp } from "lucide-react";

import { CurrencyDisplay, formatCurrency } from "@/components/ui/currency-display";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalyticsRangeKey, ExpenseAnalytics } from "@/types";

const RANGE_OPTIONS: Array<{ key: AnalyticsRangeKey; label: string }> = [
  { key: "90d", label: "Last 90 days" },
  { key: "180d", label: "Last 180 days" },
  { key: "365d", label: "Last 365 days" },
];
const TREND_COLORS = ["#dc5d30", "#111418", "#d9895d", "#95a6ba"];
const METHOD_COLORS = ["#111418", "#dc5d30", "#d9895d", "#95a6ba", "#cdb28f"];

type ValueTooltipProps = {
  active?: boolean;
  currency?: string;
  label?: string;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number | string;
  }>;
};

type ReportAnalyticsProps = {
  analytics?: ExpenseAnalytics;
  isLoading: boolean;
  selectedRange: AnalyticsRangeKey;
  onRangeChange: (range: AnalyticsRangeKey) => void;
};

function ValueTooltip({ active, currency = "USD", label, payload }: ValueTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-[1.2rem] border border-black/10 bg-white/94 px-4 py-3 shadow-line">
      <p className="text-xs uppercase tracking-[0.28em] text-black/42">{label}</p>
      <div className="mt-2 space-y-2">
        {payload.map((item) => (
          <div className="flex items-center justify-between gap-4 text-sm" key={item.name}>
            <span className="inline-flex items-center gap-2 text-black/62">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? "#111418" }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-ink">
              {formatCurrency({ currency, value: Number(item.value ?? 0) })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function ReportAnalytics({
  analytics,
  isLoading,
  selectedRange,
  onRangeChange,
}: ReportAnalyticsProps) {
  const trendData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return analytics.trends.map((point) => {
      const row: Record<string, number | string> = {
        label: point.label,
        total_spend: Number(point.total_spend),
      };

      for (const category of point.category_totals) {
        row[category.category_name] = Number(category.total_spend);
      }

      return row;
    });
  }, [analytics]);

  const paymentMethodData = useMemo(
    () =>
      (analytics?.payment_methods ?? [])
        .filter((method) => Number(method.total_spend) > 0)
        .map((method, index) => ({
          color: METHOD_COLORS[index % METHOD_COLORS.length],
          label: method.payment_method_label,
          subscriptions: method.active_subscriptions,
          total_spend: Number(method.total_spend),
        })),
    [analytics],
  );

  const savingsChartData = useMemo(
    () =>
      (analytics?.categories ?? [])
        .filter((category) => Number(category.projected_range_savings) > 0)
        .slice(0, 5)
        .reverse()
        .map((category) => ({
          active_subscriptions: category.active_subscriptions,
          category_name: category.category_name,
          projected_monthly_savings: Number(category.projected_monthly_savings),
          projected_range_savings: Number(category.projected_range_savings),
        })),
    [analytics],
  );

  const summary = analytics?.summary;
  const displayCurrency = summary?.currency ?? "USD";
  const hasObservedSpend = Number(summary?.total_spend ?? 0) > 0;
  const hasProjectedSavings = savingsChartData.length > 0;
  const hasPaymentMix = paymentMethodData.length > 0;

  return (
    <section className="space-y-6 rounded-[2.2rem] border border-black/10 bg-white/80 p-6 shadow-line backdrop-blur sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-black/42">Spend analytics</p>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-ink">Category analytics</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-black/62">
              Compare actual spend in the selected window against the recurring savings still tied
              up in active categories, payment rails, and renewal cadence.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              className="rounded-full px-4"
              key={option.key}
              onClick={() => onRangeChange(option.key)}
              type="button"
              variant={selectedRange === option.key ? "default" : "outline"}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-black/10 bg-[#101922] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-white/42">Observed spend</p>
          <CurrencyDisplay
            className="mt-3 block text-3xl font-semibold tracking-tight"
            currency={displayCurrency}
            value={Number(summary?.total_spend ?? 0)}
          />
          <p className="mt-3 text-sm text-white/62">
            {analytics ? analytics.window.label : "Selected window"} · approx. {displayCurrency}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-black/10 bg-stone/70 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Average month</p>
          <CurrencyDisplay
            className="mt-3 block text-3xl font-semibold tracking-tight text-ink"
            currency={displayCurrency}
            value={Number(summary?.average_monthly_spend ?? 0)}
          />
          <p className="mt-3 text-sm text-black/58">Actual spend normalized to the selected window.</p>
        </div>

        <div className="rounded-[1.5rem] border border-black/10 bg-stone/70 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Active subscriptions</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {summary?.active_subscriptions ?? 0}
          </p>
          <p className="mt-3 text-sm text-black/58">
            Recurring plans contributing to the savings projection.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-black/10 bg-stone/70 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Potential savings</p>
          <CurrencyDisplay
            className="mt-3 block text-3xl font-semibold tracking-tight text-ink"
            currency={displayCurrency}
            value={Number(summary?.projected_range_savings ?? 0)}
          />
          <p className="mt-3 text-sm text-black/58">
            Projected savings if the active category spend were trimmed over this window.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[1.7rem] border border-black/10 bg-white/90 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
              <BarChart3 className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Stacked bars</p>
              <h3 className="mt-1 text-xl font-semibold text-ink">Spend by category over time</h3>
            </div>
          </div>

          <div className="mt-5 h-72">
            {hasObservedSpend ? (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={trendData} margin={{ bottom: 0, left: -12, right: 8, top: 6 }}>
                  <CartesianGrid
                    stroke="rgba(17,20,24,0.08)"
                    strokeDasharray="4 8"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: "rgba(17,20,24,0.45)", fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ValueTooltip currency={displayCurrency} />}
                    cursor={{ fill: "rgba(220, 93, 48, 0.08)" }}
                  />
                  {analytics?.trend_categories.map((categoryName, index) => (
                    <Bar
                      dataKey={categoryName}
                      fill={TREND_COLORS[index % TREND_COLORS.length]}
                      key={categoryName}
                      name={categoryName}
                      radius={index === analytics.trend_categories.length - 1 ? [10, 10, 0, 0] : 0}
                      stackId="categories"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-dashed border-black/10 bg-stone/50 px-6 text-center text-sm leading-6 text-black/58">
                No settled payment history landed inside this window yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-black/10 bg-white/90 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Line chart</p>
              <h3 className="mt-1 text-xl font-semibold text-ink">Overall spend trend</h3>
            </div>
          </div>

          <div className="mt-5 h-72">
            {hasObservedSpend ? (
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={trendData} margin={{ bottom: 0, left: -12, right: 8, top: 6 }}>
                  <CartesianGrid
                    stroke="rgba(17,20,24,0.08)"
                    strokeDasharray="4 8"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: "rgba(17,20,24,0.45)", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fill: "rgba(17,20,24,0.45)", fontSize: 12 }}
                    tickFormatter={(value) => `${displayCurrency} ${value}`}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip content={<ValueTooltip currency={displayCurrency} />} />
                  <Line
                    dataKey="total_spend"
                    dot={{ fill: "#dc5d30", r: 4 }}
                    name="Total spend"
                    stroke="#dc5d30"
                    strokeWidth={3}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-dashed border-black/10 bg-stone/50 px-6 text-center text-sm leading-6 text-black/58">
                Spend history will plot here once statement imports or renewal syncs create payment rows.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-black/10 bg-white/90 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
              <Landmark className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Donut</p>
              <h3 className="mt-1 text-xl font-semibold text-ink">Payment method mix</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(220px,0.8fr)]">
            <div className="h-72">
              {hasPaymentMix ? (
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      dataKey="total_spend"
                      innerRadius={72}
                      outerRadius={108}
                      paddingAngle={3}
                    >
                      {paymentMethodData.map((entry) => (
                        <Cell fill={entry.color} key={entry.label} />
                      ))}
                    </Pie>
                    <Tooltip content={<ValueTooltip currency={displayCurrency} />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-dashed border-black/10 bg-stone/50 px-6 text-center text-sm leading-6 text-black/58">
                  Payment-method mix appears once settled payments land inside the selected window.
                </div>
              )}
            </div>

            <div className="space-y-3">
              {paymentMethodData.map((method) => (
                <div className="rounded-[1.3rem] border border-black/10 bg-stone/60 p-4" key={method.label}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{method.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-black/42">
                        {method.subscriptions} active subscriptions
                      </p>
                    </div>
                    <span className="mt-1 size-3 rounded-full" style={{ backgroundColor: method.color }} />
                  </div>
                  <CurrencyDisplay
                    className="mt-4 block text-2xl font-semibold tracking-tight text-ink"
                    currency={displayCurrency}
                    value={method.total_spend}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-black/10 bg-white/90 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
              <PiggyBank className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-black/42">Horizontal bars</p>
              <h3 className="mt-1 text-xl font-semibold text-ink">Potential savings</h3>
            </div>
          </div>

          <div className="mt-5 h-72">
            {hasProjectedSavings ? (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={savingsChartData}
                  layout="vertical"
                  margin={{ bottom: 0, left: 32, right: 16, top: 6 }}
                >
                  <CartesianGrid horizontal={false} stroke="rgba(17,20,24,0.08)" strokeDasharray="4 8" />
                  <XAxis
                    axisLine={false}
                    tick={{ fill: "rgba(17,20,24,0.45)", fontSize: 12 }}
                    tickFormatter={(value) => `${displayCurrency} ${value}`}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="category_name"
                    tick={{ fill: "rgba(17,20,24,0.6)", fontSize: 12 }}
                    tickLine={false}
                    type="category"
                    width={110}
                  />
                  <Tooltip
                    content={<ValueTooltip currency={displayCurrency} />}
                    cursor={{ fill: "rgba(220, 93, 48, 0.08)" }}
                  />
                  <Bar
                    dataKey="projected_range_savings"
                    fill="#111418"
                    name="Projected savings"
                    radius={[0, 10, 10, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-dashed border-black/10 bg-stone/50 px-6 text-center text-sm leading-6 text-black/58">
                Savings projections need at least one active subscription in the workspace.
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {savingsChartData.map((category) => (
              <div className="rounded-[1.3rem] border border-black/10 bg-stone/60 p-4" key={category.category_name}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{category.category_name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-black/42">
                      {category.active_subscriptions} active subscriptions
                    </p>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay
                      className="block text-xl font-semibold tracking-tight text-ink"
                      currency={displayCurrency}
                      value={category.projected_range_savings}
                    />
                    <p className="mt-1 text-xs text-black/52">
                      {formatCurrency({
                        currency: displayCurrency,
                        value: category.projected_monthly_savings,
                      })} per month
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[1.7rem] border border-black/10 bg-[#101922] p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/10 text-white">
            <Clock3 className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/42">Frequency distribution</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Recurring cadence pressure</h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(analytics?.frequency_distribution ?? []).map((item) => (
            <div
              className={cn(
                "rounded-[1.35rem] border border-white/10 bg-white/6 p-4",
                item.subscription_count === 0 ? "text-white/40" : "text-white",
              )}
              key={item.cadence}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{item.subscription_count}</p>
              <p className="mt-2 text-sm text-white/64">
                {formatCurrency({
                  currency: displayCurrency,
                  value: Number(item.monthly_equivalent),
                })} in monthly-equivalent spend
              </p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-sm text-white/58">
          Window:{" "}
          {analytics
            ? `${formatDate(analytics.window.start_date)} to ${formatDate(analytics.window.end_date)}`
            : "Loading analytics window"}
        </p>
      </section>

      {isLoading ? (
        <div className="rounded-[1.6rem] border border-dashed border-black/10 bg-stone/60 px-5 py-4 text-sm text-black/58">
          Refreshing analytics for the selected date range...
        </div>
      ) : null}
    </section>
  );
}
