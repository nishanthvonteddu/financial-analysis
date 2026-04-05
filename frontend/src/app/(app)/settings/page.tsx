import { ShieldCheck, SlidersHorizontal } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={<ThemeToggle />}
        description="Session controls, theme preferences, and later workspace defaults all belong here. The authenticated shell can now host them consistently."
        eyebrow="Settings"
        title="Workspace controls"
      />

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white/72 p-6 shadow-line backdrop-blur sm:p-8">
          <div className="flex items-center justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-black/45">Live preference</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">Theme mode</h3>
            </div>
            <SlidersHorizontal className="size-5 text-ember" />
          </div>
          <p className="mt-5 max-w-lg text-base leading-7 text-black/65">
            Theme switching is already wired into the shell, so the user can move between light
            and dark modes without leaving the workspace.
          </p>
          <div className="mt-6">
            <ThemeToggle />
          </div>
        </div>

        <EmptyState
          description="Role management, alert defaults, shared household settings, and other operational controls should accumulate here instead of leaking into product pages."
          eyebrow="Reserved for later milestones"
          icon={<ShieldCheck className="size-5" />}
          title="Core settings scaffolding is ready."
        />
      </section>
    </div>
  );
}
