"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  LineChart,
  Menu,
  ReceiptText,
  WalletCards,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { FloatingPaths } from "@/components/ui/background-paths";

const navItems = [
  { href: "/dashboard", label: "Analysis", hasDropdown: true },
  { href: "/reports", label: "Reports", hasDropdown: true },
  { href: "/uploads", label: "Imports", hasDropdown: true },
  { href: "/subscriptions", label: "Subscriptions" },
];

const proofPoints = [
  { icon: LineChart, label: "Cash-flow trend analysis" },
  { icon: ReceiptText, label: "Statement import intelligence" },
  { icon: WalletCards, label: "Subscription tracking as a feature" },
];

const Hero2 = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,#020617_0%,#0a0d14_46%,#000_100%)]" />
      <div className="absolute inset-0 z-0 opacity-55">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_72%_10%,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_28%_30%,rgba(148,163,184,0.14),transparent_30%),radial-gradient(circle_at_52%_62%,rgba(255,255,255,0.08),transparent_32%)]" />
      <div className="bg-matte pointer-events-none absolute inset-0 z-0 opacity-38" />
      <div className="bg-noise pointer-events-none absolute inset-0 z-0 opacity-24" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.24)_54%,rgba(0,0,0,0.8)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-80 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <div className="relative z-10">
        <nav className="mx-auto mt-6 flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center" href="/">
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-black">
              <BarChart3 className="size-5" aria-hidden="true" />
            </span>
            <span className="ml-3 text-xl font-bold text-white">FinSight</span>
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            <div className="flex items-center space-x-7">
              {navItems.map((item) => (
                <NavItem
                  hasDropdown={item.hasDropdown}
                  href={item.href}
                  key={item.label}
                  label={item.label}
                />
              ))}
            </div>
            <Link
              className="inline-flex h-12 items-center rounded-full bg-white px-8 text-base font-medium text-black transition hover:bg-white/90"
              href="/login"
            >
              Login
            </Link>
          </div>

          <button
            aria-expanded={mobileMenuOpen}
            className="md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="size-6 text-white" />
            ) : (
              <Menu className="size-6 text-white" />
            )}
          </button>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              animate={{ y: 0 }}
              className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 backdrop-blur-md md:hidden"
              exit={{ y: "-100%" }}
              initial={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <Link className="flex items-center" href="/" onClick={() => setMobileMenuOpen(false)}>
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-black">
                    <BarChart3 className="size-5" aria-hidden="true" />
                  </span>
                  <span className="ml-3 text-xl font-bold text-white">FinSight</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} type="button">
                  <span className="sr-only">Close menu</span>
                  <X className="size-6 text-white" />
                </button>
              </div>
              <div className="mt-8 flex flex-col space-y-6">
                {navItems.map((item) => (
                  <MobileNavItem
                    href={item.href}
                    key={item.label}
                    label={item.label}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
                <Link
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-gray-700 text-base font-medium text-white transition hover:bg-white/10"
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-8 text-base font-medium text-black transition hover:bg-white/90"
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start analysis
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-4 mt-7 flex max-w-full flex-col items-center justify-center gap-1 rounded-full bg-white/10 px-4 py-2 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-sm sm:mx-auto sm:max-w-fit sm:flex-row sm:gap-2">
          <span className="min-w-0 text-sm font-medium leading-5 text-white">
            Financial analysis
            <span className="block sm:inline"> with recurring-spend visibility</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-white" aria-hidden="true" />
        </div>

        <section className="mx-auto mt-12 w-full max-w-7xl overflow-hidden px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mx-auto max-w-[21rem] text-3xl font-bold leading-tight text-white min-[390px]:text-4xl sm:max-w-5xl sm:text-5xl md:text-6xl lg:text-7xl">
            Financial analysis that turns transactions into decisions
          </h1>
          <p className="mx-auto mt-6 max-w-[21rem] text-base leading-7 text-gray-300 sm:max-w-2xl sm:text-lg sm:leading-8">
            Import statements, detect spending patterns, forecast cash flow, and review recurring costs
            from one financial command center.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-medium text-black transition hover:bg-white/90"
              href="/register"
            >
              Start financial analysis
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-gray-600 px-8 text-base font-medium text-white transition hover:bg-white/10"
              href="/dashboard"
            >
              View command center
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {proofPoints.map(({ icon: Icon, label }) => (
              <div
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
                key={label}
              >
                <Icon className="size-4 shrink-0 text-white/78" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="relative mx-auto my-16 w-full max-w-6xl md:my-20">
            <div className="bg-grainy absolute inset-0 rounded-[3rem] bg-white opacity-20 blur-[10rem]" />
            <div className="absolute -inset-10 rounded-[4rem] bg-[radial-gradient(circle_at_62%_30%,rgba(125,211,252,0.18),transparent_34%),radial-gradient(circle_at_42%_18%,rgba(251,191,36,0.12),transparent_32%)] blur-3xl" />
            <div className="dashboard-hero-blend relative">
              <Image
                alt="Financial analysis command center preview"
                className="h-auto w-full rounded-[2rem] grayscale opacity-95 shadow-[0_42px_150px_rgba(0,0,0,0.78)]"
                height={900}
                priority
                src="/financial-dashboard-reference.jpg"
                width={1200}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

function NavItem({
  href,
  label,
  hasDropdown,
}: {
  href: string;
  label: string;
  hasDropdown?: boolean;
}) {
  return (
    <Link className="flex items-center text-sm text-gray-300 transition hover:text-white" href={href}>
      <span>{label}</span>
      {hasDropdown ? <ChevronDown className="ml-1 size-4" aria-hidden="true" /> : null}
    </Link>
  );
}

function MobileNavItem({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white"
      href={href}
      onClick={onClick}
    >
      <span>{label}</span>
      <ArrowRight className="size-4 text-gray-400" aria-hidden="true" />
    </Link>
  );
}

export { Hero2 };
