"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileDown,
  FileUp,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { NotificationBell } from "@/components/notifications/notification-panel";
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
    caption: "Financial command center",
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Analysis",
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
    caption: "Recurring spend",
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
    caption: "Portable files",
    href: "/exports",
    icon: FileDown,
    label: "Exports",
    mobileLabel: "Export",
  },
  {
    caption: "Cards and billing",
    href: "/payments",
    icon: CreditCard,
    label: "Payments",
    mobileLabel: "Pay",
  },
  {
    caption: "Household sharing",
    href: "/family",
    icon: UsersRound,
    label: "Family",
    mobileLabel: "Family",
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
    description: "Upcoming recurring charges and scheduled financial events, shown as a planning calendar.",
    searchPlaceholder: "Search charge dates, reminder windows, shared calendars",
    title: "Financial calendar",
  },
  "/dashboard": {
    description: "Live overview of statement imports, spend trends, categories, recurring exposure, and actions that need attention.",
    searchPlaceholder: "Search statements, merchants, categories, reports",
    title: "Financial analysis",
  },
  "/exports": {
    description: "CSV, JSON, and calendar files for exporting analysis, transactions, reports, and recurring-spend data.",
    searchPlaceholder: "Search export formats, reports, transaction history",
    title: "Exports",
  },
  "/family": {
    description: "Household-level visibility for shared expenses, privacy controls, and overlapping recurring costs.",
    searchPlaceholder: "Search family members, shared expenses, invite codes",
    title: "Household",
  },
  "/reports": {
    description: "Chart-backed expense reports generated from uploaded statements and payment history.",
    searchPlaceholder: "Search reports, upload names, merchants, categories",
    title: "Reports",
  },
  "/score": {
    description: "Recurring-spend score, duplicate overlap candidates, and cleanup actions inside the broader financial picture.",
    searchPlaceholder: "Search score recommendations, duplicate candidates, renewal gaps",
    title: "Recurring spend score",
  },
  "/payments": {
    description: "Cards, accounts, billing rails, and payment methods used across imported transactions and recurring costs.",
    searchPlaceholder: "Search cards, accounts, billing fallback, payment health",
    title: "Payments",
  },
  "/uploads": {
    description: "Upload statement files, watch queue status, and manage ingestion history.",
    searchPlaceholder: "Search uploads, providers, queue status, file history",
    title: "Uploads",
  },
  "/settings": {
    description: "Currency, theme, financial workspace defaults, and session controls stay here.",
    searchPlaceholder: "Search preferences, access, workspace settings",
    title: "Settings",
  },
  "/subscriptions": {
    description: "Track recurring plans as one part of the larger spend analysis workspace.",
    searchPlaceholder: "Search plans, vendors, categories, payment methods",
    title: "Recurring spend",
  },
};

function getInitials(name: string | undefined, email: string | undefined) {
  const source = name?.trim() || email?.split("@")[0] || "FS";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "FS";
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  const meta =
    Object.entries(routeMeta).find(([href]) => isActivePath(pathname, href))?.[1] ??
    routeMeta["/dashboard"];
  const currentNavItem = navItems.find((item) => isActivePath(pathname, item.href));
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Workspace operator";

  const handleSignOut = () => {
    logout();
    setIsSignOutDialogOpen(false);
    setIsUserMenuOpen(false);
    router.replace("/login");
  };

  return (
    <ProtectedRoute>
      <a
        className="sr-only z-50 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#workspace-content"
      >
        Skip to workspace content
      </a>
      <div className="min-h-screen bg-background dark:bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
        <aside
          aria-label="Primary sidebar"
          className={cn(
            "hidden min-h-screen flex-col border-r border-black/10 bg-ink text-white transition-[width] duration-200 md:flex",
            isSidebarExpanded ? "md:w-72" : "md:w-20",
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center border-b border-white/10 px-4 xl:px-5",
              isSidebarExpanded ? "justify-between" : "justify-center",
            )}
          >
            <div className={cn("min-w-0", isSidebarExpanded ? "block" : "hidden")}>
              <p className="truncate text-base font-semibold text-white">
                FinSight
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                Analysis workspace
              </p>
            </div>
            <button
              aria-label={isSidebarExpanded ? "Close operator panel" : "Open operator panel"}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/72 transition hover:border-white/18 hover:bg-white/8 hover:text-white"
              onClick={() => setIsSidebarExpanded((current) => !current)}
              title={isSidebarExpanded ? "Close panel" : "Open panel"}
              type="button"
            >
              {isSidebarExpanded ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
            </button>
          </div>

          <nav aria-label="Primary sidebar" className="flex-1 px-3 py-4 xl:px-4">
            <div className="space-y-1">
              {navItems.map(({ caption, href, icon: Icon, label }) => {
                const active = isActivePath(pathname, href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition duration-150",
                      active
                        ? "bg-white text-ink shadow-line"
                        : "text-white/68 hover:bg-white/8 hover:text-white",
                    )}
                    href={href}
                    key={href}
                    onFocus={() => router.prefetch(href)}
                    onMouseEnter={() => router.prefetch(href)}
                  >
                    <span
                      className={cn(
                        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition",
                        active
                          ? "border-black/10 bg-stone/80 text-ink"
                          : "border-white/10 bg-white/5 text-white/75 group-hover:border-white/18 group-hover:bg-white/10",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>

                    <div
                      className={cn(
                        "min-w-0",
                        isSidebarExpanded ? "block" : "hidden",
                      )}
                    >
                      <p className="truncate text-sm font-semibold leading-5">{label}</p>
                      <p
                        className={cn(
                          "truncate text-xs leading-5",
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

          <div className="border-t border-white/10 px-4 py-4">
            <div
              className={cn(
                "rounded-xl border border-white/10 bg-white/6 p-4",
                isSidebarExpanded ? "block" : "hidden",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Milestone status</p>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Statement analysis, reports, recurring-spend tracking, exports, and household views
                now live under one financial workspace.
              </p>
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-background/95 backdrop-blur dark:border-white/10">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/48 dark:text-white/48">
                  {currentNavItem?.label ?? meta.title}
                </p>
                <h1
                  className="mt-0.5 truncate text-xl font-semibold text-ink dark:text-white sm:text-2xl"
                  data-testid="app-shell-route-title"
                >
                  {meta.title}
                </h1>
              </div>

              <label className="relative hidden max-w-md flex-1 items-center md:flex">
                <Search className="pointer-events-none absolute left-4 size-4 text-black/38" />
                <input
                  aria-label="Search workspace"
                  className="h-10 w-full rounded-lg border border-black/10 bg-white pl-10 pr-4 text-sm text-ink placeholder:text-black/38 transition focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-ember/20 dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-white/38"
                  placeholder={meta.searchPlaceholder}
                  type="search"
                />
              </label>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle compact />

                <NotificationBell />

                <div className="relative">
                  <button
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                    className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-left transition hover:border-black/20 hover:bg-stone/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/30 dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/12"
                    onClick={() => setIsUserMenuOpen((open) => !open)}
                    type="button"
                  >
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white dark:bg-white dark:text-ink">
                      {getInitials(user?.full_name, user?.email)}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span className="block truncate text-sm font-semibold text-ink dark:text-white">
                        {displayName}
                      </span>
                      <span className="block truncate text-xs text-black/48 dark:text-white/48">
                        {user?.email}
                      </span>
                    </span>
                    <ChevronDown className="hidden size-4 text-black/45 dark:text-white/45 sm:block" />
                  </button>

                  {isUserMenuOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+12px)] w-72 animate-page-enter rounded-xl border border-black/10 bg-white p-3 shadow-[0_24px_80px_rgba(17,20,24,0.18)] dark:border-white/10 dark:bg-ink"
                      role="menu"
                    >
                      <div className="rounded-lg bg-stone/70 px-4 py-3 dark:bg-white/8">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/42 dark:text-white/42">
                          Signed in as
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink dark:text-white">
                          {displayName}
                        </p>
                        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                          {user?.email}
                        </p>
                      </div>

                      <button
                        className="mt-3 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-stone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/35 dark:text-white dark:hover:bg-white/10"
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
                  aria-label="Search workspace"
                  className="h-10 w-full rounded-lg border border-black/10 bg-white pl-10 pr-4 text-sm text-ink placeholder:text-black/38 transition focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-ember/20 dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-white/38"
                  placeholder={meta.searchPlaceholder}
                  type="search"
                />
              </label>
            </div>
          </header>

          <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8" id="workspace-content">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>

          <nav
            aria-label="Primary mobile"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-background/96 px-3 py-2 backdrop-blur dark:border-white/10 md:hidden"
          >
            <div className="grid auto-cols-[4.75rem] grid-flow-col gap-1 overflow-x-auto pb-1">
              {navItems.map(({ href, icon: Icon, mobileLabel }) => {
                const active = isActivePath(pathname, href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium transition",
                      active
                        ? "bg-[#101922] text-white dark:bg-white dark:text-ink"
                        : "text-black/58 hover:bg-white hover:text-ink dark:text-white/58 dark:hover:bg-white/10 dark:hover:text-white",
                    )}
                    href={href}
                    key={href}
                    onFocus={() => router.prefetch(href)}
                    onMouseEnter={() => router.prefetch(href)}
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
