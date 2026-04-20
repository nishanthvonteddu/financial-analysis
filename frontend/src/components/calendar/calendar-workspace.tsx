"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CalendarDay, CalendarRenewalItem, CalendarRenewalResponse } from "@/types";

type CalendarWorkspaceProps = {
  calendar?: CalendarRenewalResponse;
  isLoading?: boolean;
  onMonthChange: (nextMonth: Date) => void;
  selectedMonth: Date;
};

type MonthCell = {
  currentMonth: boolean;
  date: string;
  day: number;
  renewals: CalendarRenewalItem[];
  totalAmount: string;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options).format(toDate(value));
}

function shiftMonth(value: Date, offset: number) {
  return new Date(value.getFullYear(), value.getMonth() + offset, 1);
}

function getMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function buildMonthCells(calendar: CalendarRenewalResponse | undefined, selectedMonth: Date) {
  const dayMap = new Map<string, CalendarDay>(
    (calendar?.days ?? []).map((day) => [day.date, day]),
  );
  const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index): MonthCell => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const isoDate = toIsoDate(date);
    const calendarDay = dayMap.get(isoDate);

    return {
      currentMonth: date.getMonth() === selectedMonth.getMonth(),
      date: isoDate,
      day: date.getDate(),
      renewals: calendarDay?.renewals ?? [],
      totalAmount: calendarDay?.total_amount ?? "0.00",
    };
  });
}

function getInitialSelectedDate(calendar: CalendarRenewalResponse | undefined, selectedMonth: Date) {
  const today = new Date();
  if (
    today.getFullYear() === selectedMonth.getFullYear()
    && today.getMonth() === selectedMonth.getMonth()
  ) {
    return toIsoDate(today);
  }

  return calendar?.days.find((day) => day.renewals.length > 0)?.date ?? toIsoDate(selectedMonth);
}

function getRenewalStatusLabel(renewalCount: number) {
  if (renewalCount === 0) {
    return "No renewals";
  }

  return `${renewalCount} renewal${renewalCount === 1 ? "" : "s"}`;
}

function RenewalList({ renewals }: { renewals: CalendarRenewalItem[] }) {
  if (renewals.length === 0) {
    return (
      <p className="rounded-[1.2rem] border border-black/10 bg-stone/70 px-4 py-3 text-sm leading-6 text-black/58">
        No scheduled renewals on this date.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {renewals.map((renewal) => (
        <div
          className="rounded-[1.25rem] border border-black/10 bg-white/88 p-4 shadow-line"
          key={`${renewal.subscription_id}-${renewal.renewal_date}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">{renewal.name}</p>
              <p className="mt-1 text-sm text-black/58">
                {renewal.category_name} - {renewal.cadence}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-ink">
              {formatCurrency({
                currency: renewal.currency,
                value: Number(renewal.amount),
              })}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/56">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-stone/65 px-3 py-1.5">
              <Clock3 className="size-3.5" />
              {formatDate(renewal.renewal_date, { day: "numeric", month: "short" })}
            </span>
            {renewal.payment_method_label ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-stone/65 px-3 py-1.5">
                <CreditCard className="size-3.5" />
                {renewal.payment_method_label}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarWorkspace({
  calendar,
  isLoading = false,
  onMonthChange,
  selectedMonth,
}: CalendarWorkspaceProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    getInitialSelectedDate(calendar, selectedMonth),
  );
  const [isPending, startTransition] = useTransition();
  const monthCells = useMemo(
    () => buildMonthCells(calendar, selectedMonth),
    [calendar, selectedMonth],
  );
  const selectedCell =
    monthCells.find((cell) => cell.date === selectedDate && cell.currentMonth)
    ?? monthCells.find((cell) => cell.currentMonth)
    ?? monthCells[0];
  const monthLabel = getMonthLabel(selectedMonth);
  const selectedDayLabel = formatDate(selectedCell.date, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  });

  useEffect(() => {
    setSelectedDate(getInitialSelectedDate(calendar, selectedMonth));
  }, [calendar, selectedMonth]);

  const handleMonthChange = (offset: number) => {
    startTransition(() => {
      onMonthChange(shiftMonth(selectedMonth, offset));
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
      <section className="rounded-[2rem] border border-black/10 bg-white/76 p-4 shadow-line backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/42">Renewal calendar</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{monthLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-black/62">
              {calendar?.total_renewals ?? 0} projected renewal
              {(calendar?.total_renewals ?? 0) === 1 ? "" : "s"} in this month.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              aria-label="Previous month"
              className="size-11 rounded-full p-0"
              onClick={() => handleMonthChange(-1)}
              type="button"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              aria-label="Next month"
              className="size-11 rounded-full p-0"
              onClick={() => handleMonthChange(1)}
              type="button"
              variant="outline"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.24em] text-black/38">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {monthCells.map((cell) => {
            const isSelected = cell.date === selectedCell.date;
            const hasRenewals = cell.renewals.length > 0;

            return (
              <div className="relative min-w-0" key={cell.date}>
                <button
                  aria-label={`${formatDate(cell.date, {
                    day: "numeric",
                    month: "long",
                  })}: ${getRenewalStatusLabel(cell.renewals.length)}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex aspect-square w-full min-w-0 flex-col justify-between rounded-[1.15rem] border p-2 text-left transition sm:p-3",
                    cell.currentMonth
                      ? "border-black/10 bg-stone/65 text-ink hover:border-black/20 hover:bg-white"
                      : "border-transparent bg-transparent text-black/24",
                    isSelected ? "border-[#101922] bg-white shadow-line" : "",
                  )}
                  onClick={() => setSelectedDate(cell.date)}
                  type="button"
                >
                  <span className="text-sm font-semibold">{cell.day}</span>
                  <span className="flex h-5 items-end gap-1 overflow-hidden">
                    {cell.renewals.slice(0, 3).map((renewal) => (
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full bg-ember"
                        key={`${cell.date}-${renewal.subscription_id}`}
                      />
                    ))}
                    {cell.renewals.length > 3 ? (
                      <span className="text-[10px] font-semibold text-black/50">
                        +{cell.renewals.length - 3}
                      </span>
                    ) : null}
                  </span>
                </button>

                {isSelected && hasRenewals ? (
                  <div
                    aria-label={`Renewals for ${selectedDayLabel}`}
                    className="absolute left-1/2 top-[calc(100%+0.5rem)] z-20 hidden w-72 -translate-x-1/2 rounded-[1.35rem] border border-black/10 bg-white/96 p-4 text-left shadow-line backdrop-blur lg:block"
                    role="dialog"
                  >
                    <p className="text-xs uppercase tracking-[0.26em] text-black/42">
                      {formatDate(cell.date, { day: "numeric", month: "short" })}
                    </p>
                    <div className="mt-3 space-y-2">
                      {cell.renewals.slice(0, 3).map((renewal) => (
                        <div className="flex items-center justify-between gap-3" key={renewal.subscription_id}>
                          <span className="truncate text-sm font-medium text-ink">
                            {renewal.name}
                          </span>
                          <span className="text-xs font-semibold text-black/58">
                            {formatCurrency({
                              currency: renewal.currency,
                              value: Number(renewal.amount),
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {isLoading || isPending ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <section className="rounded-[2rem] border border-black/10 bg-[#101922] p-6 text-white shadow-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">Selected day</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{selectedDayLabel}</h2>
            </div>
            <span className="inline-flex size-12 items-center justify-center rounded-[1rem] bg-white/10">
              <CalendarDays className="size-5" />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/38">Renewals</p>
              <p className="mt-2 text-3xl font-semibold">{selectedCell.renewals.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/38">Total</p>
              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency({
                  value: Number(selectedCell.totalAmount),
                })}
              </p>
            </div>
          </div>
        </section>

        {calendar && calendar.total_renewals === 0 && !isLoading ? (
          <EmptyState
            action={
              <Button asChild className="rounded-full px-5" variant="outline">
                <Link href="/subscriptions">
                  Add renewal dates
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            }
            description="Active subscriptions with auto-renewal and next charge dates will appear in the calendar."
            icon={<CalendarDays className="size-5" />}
            title="No renewals scheduled this month"
          />
        ) : (
          <section className="rounded-[2rem] border border-black/10 bg-white/76 p-5 shadow-line backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/42">Day detail</p>
                <h3 className="mt-1 text-xl font-semibold text-ink">
                  {getRenewalStatusLabel(selectedCell.renewals.length)}
                </h3>
              </div>
            </div>
            <RenewalList renewals={selectedCell.renewals} />
          </section>
        )}
      </aside>
    </div>
  );
}
