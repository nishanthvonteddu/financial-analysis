import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function PaymentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/dashboard">
              Review billing snapshot
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="Payment methods and billing fallback flows will expand here once the subscription management milestone lands."
        eyebrow="Payments"
        title="Billing rails have a home"
      />

      <EmptyState
        description="The app shell now reserves a destination for cards, billing instruments, and charge fallback rules, but the underlying product behavior is intentionally deferred to later milestones."
        eyebrow="Upcoming surface"
        icon={<CreditCard className="size-5" />}
        title="Payment controls arrive next."
      />
    </div>
  );
}
