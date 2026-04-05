import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/dashboard">
              Back to dashboard
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="This shell destination is ready for the Day 5 subscription management flows. The layout, navigation, and shared UI foundation are already in place."
        eyebrow="Subscriptions"
        title="Plan management is staged"
      />

      <EmptyState
        description="Manual entry, subscription editing, and richer status controls belong in the next milestone. For Day 4, the goal is a working shell with a credible destination for those flows."
        eyebrow="Day 5 handoff"
        icon={<Sparkles className="size-5" />}
        title="No editable plans yet."
      />
    </div>
  );
}
