"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileUp,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  caption: string;
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  mobileLabel: string;
};

const navItems: NavItem[] = [
  {
    caption: "Command center",
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    mobileLabel: "Home",
  },
  {
    caption: "Expense analysis",
    href: "/reports",
    icon: BarChart3,
    label: "Reports",
    mobileLabel: "Reports",
  },
  {
    caption: "Plans and spend",
    href: "/subscriptions",
    icon: Sparkles,
    label: "Subscriptions",
    mobileLabel: "Plans",
  },
  {
    caption: "Statement ingest",
    href: "/uploads",
    icon: FileUp,
    label: "Uploads",
    mobileLabel: "Files",
  },
  {
    caption: "Cards and billing",
    href: "/payments",
    icon: CreditCard,
    label: "Payments",
    mobileLabel: "Pay",
  },
  {
    caption: "Renewal timing",
    href: "/calendar",
    icon: CalendarDays,
    label: "Calendar",
    mobileLabel: "Dates",
  },
  {
    caption: "Workspace controls",
    href: "/settings",
    icon: Settings2,
    label: "Settings",
    mobileLabel: "Prefs",
  },
];

const routeMeta: Record<string, { description: string; searchPlaceholder: string; title: string }> = {
  "/calendar": {
    description: "Renewal views and reminder pacing will land here as scheduling work expands.",
    searchPlaceholder: "Search renewal dates, reminder windows, shared calendars",
    title: "Calendar",
  },
  "/dashboard": {
    description: "Live overview of recurring spend, next charges, and the queues that need attention.",
    searchPlaceholder: "Search subscriptions, merchants, reminders",
    title: "Overview",
  },
  "/reports": {
    description: "Chart-backed expense reports generated from uploaded statements and payment history.",
    searchPlaceholder: "Search reports, upload names, merchants, categories",
    title: "Reports",
  },
  "/payments": {
    description: "Billing rails, cards, and fallback payment methods live here.",
    searchPlaceholder: "Search cards, billing fallback, payment health",
    title: "Payments",
  },
  "/uploads": {
    description: "Upload statement files, watch queue status, and manage ingestion history.",
    searchPlaceholder: "Search uploads, providers, queue status, file history",
    title: "Uploads",
  },
  "/settings": {
    description: "Theme, team-level defaults, and session controls stay in this operator surface.",
    searchPlaceholder: "Search preferences, access, workspace settings",
    title: "Settings",
  },
  "/subscriptions": {
    description: "Manual entry, plan editing, and lifecycle controls are now active in this workspace.",
    searchPlaceholder: "Search plans, vendors, categories, payment methods",
    title: "Subscriptions",
  },
};

function getInitials(name: string | undefined, email: string | undefined) {
  const source = name?.trim() || email?.split("@")[0] || "MS";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "MS";
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  const meta =
    Object.entries(routeMeta).find(([href]) => isActivePath(pathname, href))?.[1] ??
    routeMeta["/dashboard"];
  const currentNavItem = navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0];
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Workspace operator";

  const handleSignOut = () => {
    logout();
    setIsSignOutDialogOpen(false);
    setIsUserMenuOpen(false);
    router.replace("/login");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,202,174,0.22),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(231,237,242,0.76)),hsl(var(--background))] md:grid md:grid-cols-[auto_minmax(0,1fr)]">
        <aside
          className={cn(
            "hidden min-h-screen flex-col border-r border-white/10 bg-[#101922] text-white md:flex",
            isSidebarExpanded ? "md:w-72" : "md:w-24 xl:w-72",
          )}
        >
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-4 xl:px-6">
            <div className="min-w-0">
              <p className="truncate font-serif text-2xl tracking-tight text-white">
                MySubscription
              </p>
              <p
                className={cn(
                  "mt-1 text-[11px] uppercase tracking-[0.32em] text-white/42",
                  isSidebarExpanded ? "block" : "hidden xl:block",
                )}
              >
                Operator shell
              </p>
            </div>
            <button
              aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/18 hover:bg-white/8 hover:text-white"
              onClick={() => setIsSidebarExpanded((current) => !current)}
              type="button"
            >
              {isSidebarExpanded ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
            </button>
          </div>

          <nav className="flex-1 px-3 py-6 xl:px-4">
            <div className="space-y-2">
              {navItems.map(({ caption, href, icon: Icon, label }) => {
                const active = isActivePath(pathname, href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-4 rounded-[1.4rem] px-3 py-3 transition",
                      active
                        ? "bg-white text-ink shadow-line"
                        : "text-white/68 hover:bg-white/8 hover:text-white",
                    )}
                    href={href}
                    key={href}
                  >
                    <span
                      className={cn(
                        "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border transition",
                        active
                          ? "border-black/10 bg-stone text-ink"
                          : "border-white/10 bg-white/5 text-white/75 group-hover:border-white/18 group-hover:bg-white/10",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>

                    <div
                      className={cn(
                        "min-w-0",
                        isSidebarExpanded ? "block" : "hidden xl:block",
                      )}
                    >
                      <p className="truncate text-sm font-semibold">{label}</p>
                      <p
                        className={cn(
                          "truncate text-xs",
                          active ? "text-black/52" : "text-white/45",
                        )}
                      >
                        {caption}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 px-4 py-5">
            <div
              className={cn(
                "rounded-[1.5rem] border border-white/10 bg-white/6 p-4",
                isSidebarExpanded ? "block" : "hidden xl:block",
              )}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Milestone status</p>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Subscription management, parsing, and detection are live. Upload operations now
                extend that workflow with statement intake and queue visibility.
              </p>
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-[rgba(250,248,244,0.9)] backdrop-blur">
            <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.32em] text-black/45">
                  {currentNavItem.label}
                </p>
                <h1
                  className="mt-1 truncate text-2xl font-semibold text-ink sm:text-3xl"
                  data-testid="app-shell-route-title"
                >
                  {meta.title}
                </h1>
              </div>

              <label className="relative hidden max-w-md flex-1 items-center md:flex">
                <Search className="pointer-events-none absolute left-4 size-4 text-black/38" />
                <input
                  className="h-11 w-full rounded-full border border-black/10 bg-white/78 pl-11 pr-4 text-sm text-ink placeholder:text-black/38 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-ember/20"
                  placeholder={meta.searchPlaceholder}
                  type="search"
                />
              </label>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle compact />

                <button
                  aria-label="Notifications"
                  className="relative inline-flex size-11 items-center justify-center rounded-full border border-black/10 bg-white/78 text-ink transition hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/30"
                  type="button"
                >
                  <Bell className="size-4" />
                  <span className="absolute right-3 top-3 size-2 rounded-full bg-ember" />
                </button>

                <div className="relative">
                  <button
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                    className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/82 px-3 py-2 text-left transition hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/30"
                    onClick={() => setIsUserMenuOpen((open) => !open)}
                    type="button"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#101922] text-sm font-semibold text-white">
                      {getInitials(user?.full_name, user?.email)}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {displayName}
                      </span>
                      <span className="block truncate text-xs text-black/48">{user?.email}</span>
                    </span>
                    <ChevronDown className="hidden size-4 text-black/45 sm:block" />
                  </button>

                  {isUserMenuOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+12px)] w-72 rounded-[1.5rem] border border-black/10 bg-white p-3 shadow-[0_24px_80px_rgba(17,20,24,0.18)]"
                      role="menu"
                    >
                      <div className="rounded-[1.2rem] bg-stone/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.3em] text-black/42">Signed in as</p>
                        <p className="mt-2 text-sm font-semibold text-ink">{displayName}</p>
                        <p className="mt-1 text-sm text-black/55">{user?.email}</p>
                      </div>

                      <button
                        className="mt-3 flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-stone"
                        onClick={() => {
                          setIsSignOutDialogOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <LogOut className="size-4 text-ember" />
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-black/5 px-4 py-3 md:hidden">
              <label className="relative flex items-center">
                <Search className="pointer-events-none absolute left-4 size-4 text-black/38" />
                <input
                  className="h-11 w-full rounded-full border border-black/10 bg-white/78 pl-11 pr-4 text-sm text-ink placeholder:text-black/38 focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-ember/20"
                  placeholder={meta.searchPlaceholder}
                  type="search"
                />
              </label>
            </div>
          </header>

          <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-[rgba(250,248,244,0.96)] px-3 py-2 backdrop-blur md:hidden">
            <div className="grid grid-cols-6 gap-1">
              {navItems.map(({ href, icon: Icon, mobileLabel }) => {
                const active = isActivePath(pathname, href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-medium transition",
                      active ? "bg-[#101922] text-white" : "text-black/58 hover:bg-white hover:text-ink",
                    )}
                    href={href}
                    key={href}
                  >
                    <Icon className="size-4" />
                    <span>{mobileLabel}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <ConfirmDialog
            confirmLabel="Sign out"
            description="This clears the in-memory session and sends you back to the login screen."
            onConfirm={handleSignOut}
            onOpenChange={setIsSignOutDialogOpen}
            open={isSignOutDialogOpen}
            title="Leave the workspace?"
            tone="danger"
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
