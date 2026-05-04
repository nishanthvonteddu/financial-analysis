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
  { icon: LineChart, label: "Spot trends before your bank does" },
  { icon: ReceiptText, label: "Drop a statement. Get clarity." },
  { icon: WalletCards, label: "Know where every dollar went" },
];

const Hero2 = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Colorful gradient blobs */}
      <div className="pointer-events-none absolute -right-60 -top-10 z-0 flex flex-col items-end">
        <div className="h-40 w-[60rem] rounded-full bg-gradient-to-b from-purple-600 to-sky-600 blur-[6rem]" />
        <div className="h-40 w-[90rem] rounded-full bg-gradient-to-b from-pink-900 to-yellow-400 blur-[6rem]" />
        <div className="h-40 w-[60rem] rounded-full bg-gradient-to-b from-yellow-600 to-sky-500 blur-[6rem]" />
      </div>
      {/* Animated floating paths */}
      <div className="absolute inset-0 z-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-noise opacity-20" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="mx-auto mt-6 flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center" href="/">
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-black">
              <BarChart3 aria-hidden="true" className="size-5" />
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

        {/* Mobile menu */}
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
                    <BarChart3 aria-hidden="true" className="size-5" />
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
                  Start analyzing free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <div className="mx-auto mt-7 flex max-w-fit items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-sm">
          <span className="text-sm font-medium text-white">
            Your money has a story. Time to read it.
          </span>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-white" />
        </div>

        {/* Hero */}
        <section className="mx-auto mt-12 w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            Financial intelligence that fits in one tab
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            Import your bank statements and get a full picture of where your money flows, what is
            growing, what is shrinking, and what has quietly been bleeding for months.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-medium text-black transition hover:bg-white/90"
              href="/register"
            >
              Start analyzing free
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-gray-600 px-8 text-base font-medium text-white transition hover:bg-white/10"
              href="/dashboard"
            >
              See it in action
            </Link>
          </div>

          {/* Proof points */}
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {proofPoints.map(({ icon: Icon, label }) => (
              <div
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
                key={label}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0 text-white/78" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Hero image */}
          <div className="relative -mx-4 mt-16 sm:-mx-6 lg:-mx-8">
            {/* glow behind image */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-purple-600/30 via-sky-500/20 to-transparent blur-3xl" />
            {/* top fade — content blends into image */}
            <div className="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black to-transparent" />
            {/* bottom fade — image dissolves into black */}
            <div className="absolute inset-x-0 bottom-0 z-10 h-64 bg-gradient-to-t from-black via-black/80 to-transparent" />
            {/* side fades */}
            <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
            <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />
            <Image
              alt="FinSight financial command center"
              className="h-auto w-full opacity-75 mix-blend-luminosity"
              height={900}
              priority
              src="/financial-dashboard-reference.jpg"
              width={1920}
            />
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
    <Link
      className="flex items-center text-sm text-gray-300 transition hover:text-white"
      href={href}
    >
      <span>{label}</span>
      {hasDropdown ? <ChevronDown aria-hidden="true" className="ml-1 size-4" /> : null}
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
      <ArrowRight aria-hidden="true" className="size-4 text-gray-400" />
    </Link>
  );
}

export { Hero2 };
