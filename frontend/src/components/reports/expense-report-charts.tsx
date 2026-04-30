"use client";

import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { formatCurrency } from "@/components/ui/currency-display";
import type { ExpenseReport } from "@/types";

const CATEGORY_COLORS = ["#111418", "#dc5d30", "#d9895d", "#95a6ba", "#cdb28f"];

function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload?: { total_amount?: number } }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-[1.2rem] border border-black/10 bg-white/94 px-4 py-3 shadow-line">
      <p className="text-xs uppercase tracking-[0.28em] text-black/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">
        {formatCurrency({ value: payload[0]?.payload?.total_amount ?? 0 })}
      </p>
    </div>
  );
}

export function ExpenseReportCharts({ report }: { report: ExpenseReport }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-[1.6rem] border border-black/10 bg-white/88 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-black/42">Spend trend</p>
            <h3 className="mt-1 text-xl font-semibold text-ink">Timeline by month</h3>
          </div>
        </div>

        <div className="mt-5 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              accessibilityLayer
              data={report.summary.spend_timeline.map((point) => ({
                label: point.label,
                total_amount: Number(point.total_amount),
              }))}
              margin={{ bottom: 0, left: -12, right: 8, top: 6 }}
            >
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
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(220, 93, 48, 0.08)" }} />
              <Bar dataKey="total_amount" fill="#dc5d30" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-black/10 bg-white/88 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-[1rem] border border-black/10 bg-stone text-ink">
            <PieChartIcon className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-black/42">Category split</p>
            <h3 className="mt-1 text-xl font-semibold text-ink">Where the spend landed</h3>
          </div>
        </div>

        <div className="mt-5 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={report.summary.category_breakdown.map((item) => ({
                  label: item.category_name,
                  total_amount: Number(item.total_amount),
                }))}
                dataKey="total_amount"
                innerRadius={54}
                outerRadius={92}
                paddingAngle={3}
              >
                {report.summary.category_breakdown.map((item, index) => (
                  <Cell fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} key={item.category_name} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
