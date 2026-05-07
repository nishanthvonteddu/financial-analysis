"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { useCalendarRenewals } from "@/hooks/use-calendar";

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const calendarQuery = useCalendarRenewals(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
  );

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/subscriptions">
              Manage schedules
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="Daily scheduled spend, renewal counts, and the highest-cost days for the month."
        eyebrow="Calendar"
        title="Daily spend calendar"
      />

      <CalendarWorkspace
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading && !calendarQuery.data}
        onMonthChange={setSelectedMonth}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
