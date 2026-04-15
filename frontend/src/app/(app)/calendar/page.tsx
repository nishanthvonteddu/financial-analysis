import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/dashboard">
              View the renewal queue
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="The shell now supports a dedicated scheduling surface so reminder and renewal views can land without navigation churn."
        eyebrow="Calendar"
        title="Renewal timing gets its own lane"
      />

      <EmptyState
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/subscriptions">Review upcoming renewals in subscriptions</Link>
          </Button>
        }
        description="Calendar grids, reminder windows, and cross-household renewal planning are future work. Day 4 only establishes the operator shell that will contain them."
        eyebrow="Future reminder work"
        icon={<CalendarDays className="size-5" />}
        title="No timeline widgets yet."
      />
    </div>
  );
}
