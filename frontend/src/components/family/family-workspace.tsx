"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Home,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateFamily,
  useFamilyDashboard,
  useFamilyStatus,
  useJoinFamily,
  useLeaveFamily,
  useUpdateFamilyPrivacy,
} from "@/hooks/use-family";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

function formatInviteCode(inviteCode: string | null | undefined) {
  return inviteCode || "Pending";
}

export function FamilyWorkspace() {
  const familyStatusQuery = useFamilyStatus();
  const status = familyStatusQuery.data;
  const hasFamily = Boolean(status?.family);
  const familyDashboardQuery = useFamilyDashboard(hasFamily);
  const createFamily = useCreateFamily();
  const joinFamily = useJoinFamily();
  const updatePrivacy = useUpdateFamilyPrivacy();
  const leaveFamily = useLeaveFamily();
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);

  const dashboard = familyDashboardQuery.data;
  const currentMember = status?.current_member;
  const sortedMembers = useMemo(
    () =>
      [...(status?.members ?? [])].sort((left, right) => {
        if (left.role !== right.role) {
          return left.role === "owner" ? -1 : 1;
        }
        return left.full_name.localeCompare(right.full_name);
      }),
    [status?.members],
  );

  async function handleCreateFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createFamily.mutateAsync({ name: familyName });
    setFamilyName("");
  }

  async function handleJoinFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await joinFamily.mutateAsync({ invite_code: inviteCode });
    setInviteCode("");
  }

  async function handleCopyInvite() {
    const code = status?.family?.invite_code;
    if (!code || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 1800);
  }

  if (familyStatusQuery.isLoading && !status) {
    return (
      <div className="space-y-8 animate-page-enter">
        <PageHeader
          description="Loading household membership, shared-spend totals, and plan overlap signals."
          eyebrow="Family"
          title="Family sharing"
        />
        <div className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur">
          <div className="flex items-center gap-3 text-sm text-black/58">
            <LoaderCircle className="size-4 animate-spin" />
            Loading family workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!hasFamily) {
    return (
      <div className="space-y-8 animate-page-enter">
        <PageHeader
          description="Create a household space or join one with an invite code to compare shared subscriptions."
          eyebrow="Family"
          title="Family sharing"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-black/10 bg-stone text-ink">
                <Home className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/42">Create</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">New household</h2>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCreateFamily}>
              <label className="block">
                <span className="text-sm font-medium text-ink">Family name</span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                  onChange={(event) => setFamilyName(event.target.value)}
                  placeholder="Household"
                  value={familyName}
                />
              </label>
              <Button
                className="rounded-full px-5"
                disabled={createFamily.isPending || familyName.trim().length < 2}
                type="submit"
              >
                {createFamily.isPending ? "Creating..." : "Create family"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>

            {createFamily.error ? (
              <p className="mt-4 text-sm text-ember">{getErrorMessage(createFamily.error)}</p>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-black/10 bg-stone text-ink">
                <UserPlus className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/42">Join</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">Existing household</h2>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleJoinFamily}>
              <label className="block">
                <span className="text-sm font-medium text-ink">Invite code</span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm uppercase tracking-[0.18em] text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                  placeholder="FAMILYCODE"
                  value={inviteCode}
                />
              </label>
              <Button
                className="rounded-full px-5"
                disabled={joinFamily.isPending || inviteCode.trim().length < 6}
                type="submit"
                variant="outline"
              >
                {joinFamily.isPending ? "Joining..." : "Join family"}
              </Button>
            </form>

            {joinFamily.error ? (
              <p className="mt-4 text-sm text-ember">{getErrorMessage(joinFamily.error)}</p>
            ) : null}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          <Button
            className="rounded-full px-5"
            disabled={leaveFamily.isPending}
            onClick={() => leaveFamily.mutate()}
            type="button"
            variant="outline"
          >
            <LogOut className="mr-2 size-4" />
            Leave family
          </Button>
        }
        description="Coordinate shared subscriptions, privacy, and household overlap from one workspace."
        eyebrow="Family"
        title={status?.family?.name ?? "Family sharing"}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<UsersRound className="size-5" />}
          label="Members"
          value={dashboard?.summary.member_count ?? sortedMembers.length}
        />
        <MetricTile
          icon={<ShieldCheck className="size-5" />}
          label="Sharing"
          value={dashboard?.summary.sharing_member_count ?? 0}
        />
        <MetricTile
          icon={<Sparkles className="size-5" />}
          label="Visible plans"
          value={dashboard?.summary.visible_active_subscriptions ?? 0}
        />
        <div className="rounded-[1.55rem] border border-black/10 bg-[#101922] p-5 text-white shadow-line">
          <p className="text-xs uppercase tracking-[0.3em] text-white/42">Monthly spend</p>
          {dashboard ? (
            <CurrencyDisplay
              className="mt-3 block text-3xl font-semibold tracking-tight"
              currency={dashboard.summary.currency}
              value={Number.parseFloat(dashboard.summary.visible_monthly_spend)}
            />
          ) : (
            <Skeleton className="mt-3 h-9 w-28 bg-white/15" />
          )}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/42">Members</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Household roster</h2>
              <p className="mt-2 text-sm leading-6 text-black/58">
                Invite code {formatInviteCode(status?.family?.invite_code)}
              </p>
            </div>
            <Button
              className="rounded-full px-5"
              disabled={!status?.family?.invite_code}
              onClick={handleCopyInvite}
              type="button"
              variant="outline"
            >
              <Copy className="mr-2 size-4" />
              {copiedInvite ? "Copied" : "Copy invite"}
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {sortedMembers.map((member) => (
              <div
                className="flex flex-col gap-4 rounded-[1.45rem] border border-black/10 bg-white/84 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={member.id}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#101922] text-sm font-semibold text-white">
                    {member.full_name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink">{member.full_name}</h3>
                      <span className="rounded-full border border-black/10 bg-stone px-2.5 py-1 text-xs font-medium capitalize text-black/58">
                        {member.role}
                      </span>
                      {member.is_current_user ? (
                        <span className="rounded-full border border-ember/20 bg-ember/10 px-2.5 py-1 text-xs font-medium text-ember">
                          You
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-black/52">{member.email}</p>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium",
                    member.share_subscriptions
                      ? "border-green-600/20 bg-green-50 text-green-700"
                      : "border-black/10 bg-stone text-black/55",
                  )}
                >
                  {member.share_subscriptions ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  {member.share_subscriptions ? "Sharing plans" : "Private"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/42">Privacy</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Your sharing status</h2>
              </div>
              <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-black/10 bg-stone text-ink">
                <ShieldCheck className="size-5" />
              </span>
            </div>

            <label className="mt-5 flex items-center justify-between gap-4 rounded-[1.45rem] border border-black/10 bg-stone/55 p-4">
              <span>
                <span className="block text-sm font-semibold text-ink">Share subscriptions</span>
                <span className="mt-1 block text-sm leading-6 text-black/55">
                  Included in household totals and recommendations.
                </span>
              </span>
              <input
                checked={Boolean(currentMember?.share_subscriptions)}
                className="size-5 accent-[#dc5d30]"
                disabled={updatePrivacy.isPending}
                onChange={(event) =>
                  updatePrivacy.mutate({ share_subscriptions: event.target.checked })
                }
                type="checkbox"
              />
            </label>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-black/10 bg-stone text-ink">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/42">Shared plans</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">Recommendations</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {familyDashboardQuery.isLoading && !dashboard ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <div className="rounded-[1.45rem] border border-black/10 bg-white/82 p-4" key={index}>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-3 h-4 w-10/12" />
                  </div>
                ))
              ) : dashboard?.recommendations.length ? (
                dashboard.recommendations.map((item) => (
                  <div className="rounded-[1.45rem] border border-black/10 bg-white/84 p-4" key={item.vendor}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-ink">{item.vendor}</h3>
                        <p className="mt-1 text-sm leading-6 text-black/58">
                          {item.member_names.join(", ")} · {item.subscription_count} plans
                        </p>
                      </div>
                      <CurrencyDisplay
                        className="text-sm font-semibold text-ember"
                        currency={item.currency}
                        value={Number.parseFloat(item.estimated_monthly_savings)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  description="Shared plan recommendations appear when visible members carry overlapping subscriptions."
                  icon={<Sparkles className="size-5" />}
                  title="No overlap found"
                />
              )}
            </div>
          </section>
        </section>
      </div>

      <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
        <div className="flex flex-col gap-3 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/42">Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Member spend</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(dashboard?.member_spend ?? []).map((member) => (
            <div className="rounded-[1.45rem] border border-black/10 bg-white/84 p-5" key={member.user_id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{member.full_name}</h3>
                  <p className="mt-1 text-sm text-black/52">
                    {member.visible ? `${member.active_subscriptions} visible plans` : "Private"}
                  </p>
                </div>
                {member.visible ? <Eye className="size-5 text-green-700" /> : <EyeOff className="size-5 text-black/38" />}
              </div>
              <CurrencyDisplay
                className="mt-5 block text-3xl font-semibold tracking-tight text-ink"
                currency={member.currency}
                value={Number.parseFloat(member.monthly_spend)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: number;
}>) {
  return (
    <div className="rounded-[1.55rem] border border-black/10 bg-white/78 p-5 shadow-line backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-black/42">{label}</p>
        <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-black/10 bg-stone text-ink">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}
