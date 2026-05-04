"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  PartyPopper,
  Loader,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Options as ConfettiOptions, GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance } from "canvas-confetti";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

// --- CONFETTI ---
type ConfettiApi = { fire: (opts?: ConfettiOptions) => void };
export type ConfettiRef = ConfettiApi | null;

const Confetti = forwardRef<
  ConfettiRef,
  React.ComponentPropsWithRef<"canvas"> & {
    options?: ConfettiOptions;
    globalOptions?: ConfettiGlobalOptions;
    manualstart?: boolean;
  }
>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);
  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
      } else {
        if (instanceRef.current) { instanceRef.current.reset(); instanceRef.current = null; }
      }
    },
    [globalOptions],
  );
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options]);
  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);
  useEffect(() => { if (!manualstart) fire(); }, [manualstart, fire]);
  return <canvas ref={canvasRef} {...rest} />;
});
Confetti.displayName = "Confetti";

// --- GRADIENT BACKGROUND ---
const GradientBackground = () => (
  <>
    <style>{`
      @keyframes fg1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-14px,16px) scale(1.04)}}
      @keyframes fg2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(14px,-14px) scale(1.06)}}
    `}</style>
    <svg className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#9333ea" stopOpacity="0.75"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0.2"/></radialGradient>
        <radialGradient id="g2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.65"/><stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15"/></radialGradient>
        <radialGradient id="g3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#be185d" stopOpacity="0.55"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15"/></radialGradient>
        <filter id="f1"><feGaussianBlur stdDeviation="45"/></filter>
        <filter id="f2"><feGaussianBlur stdDeviation="32"/></filter>
      </defs>
      <g style={{animation:"fg1 24s ease-in-out infinite"}}>
        <ellipse cx="160" cy="560" fill="url(#g1)" filter="url(#f1)" rx="280" ry="200" transform="rotate(-20 160 560)"/>
        <rect fill="url(#g2)" filter="url(#f2)" height="260" rx="90" transform="rotate(16 700 200)" width="320" x="540" y="80"/>
      </g>
      <g style={{animation:"fg2 30s ease-in-out infinite"}}>
        <circle cx="720" cy="520" fill="url(#g3)" filter="url(#f1)" opacity="0.7" r="180"/>
        <ellipse cx="50" cy="120" fill="#7c3aed" filter="url(#f2)" opacity="0.4" rx="190" ry="120"/>
      </g>
    </svg>
  </>
);

// --- GLASS INPUT ---
interface GlassInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
  error?: string;
}
function GlassInput({ id, label, type = "text", placeholder, value, onChange, icon, rightSlot, autoComplete, error }: GlassInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-white/60" htmlFor={id}>{label}</label>
      <div className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 backdrop-blur-sm transition-all duration-200",
        "bg-white/[0.06] border-white/10",
        "focus-within:border-purple-500/60 focus-within:bg-white/[0.09]",
        error && "border-red-400/50",
      )}>
        <span className="shrink-0 text-white/40">{icon}</span>
        <input
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-lg font-medium text-white placeholder:text-white/25 focus:outline-none"
          id={id}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
        {rightSlot}
      </div>
      {error && <p className="text-sm font-medium text-red-400">{error}</p>}
    </div>
  );
}

// --- SUBMIT BUTTON ---
function SubmitButton({ children, disabled, loading }: { children: React.ReactNode; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl px-6 py-4 text-lg font-semibold transition-all duration-200",
        "bg-white text-black hover:bg-white/92 active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      )}
      disabled={disabled || loading}
      type="submit"
    >
      <span className="flex items-center justify-center gap-3">
        {loading ? <Loader className="h-5 w-5 animate-spin" /> : null}
        {children}
        {!loading && <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />}
      </span>
    </button>
  );
}

// --- MAIN COMPONENT ---
export interface AuthComponentProps {
  mode?: "login" | "register";
  onSubmit: (data: { email: string; password: string; full_name?: string }) => Promise<void>;
  serverError?: string;
}

export function AuthComponent({ mode = "login", onSubmit, serverError }: AuthComponentProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  const fireCannons = () => {
    const fire = confettiRef.current?.fire;
    if (!fire) return;
    fire({ particleCount: 80, startVelocity: 35, spread: 360, ticks: 60, origin: { x: 0.1, y: 1 }, angle: 60 });
    fire({ particleCount: 80, startVelocity: 35, spread: 360, ticks: 60, origin: { x: 0.9, y: 1 }, angle: 120 });
  };

  const validate = () => {
    if (mode === "register" && fullName.trim().length < 2) return "Enter your full name.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (mode === "register" && password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError("");
    setLoading(true);
    try {
      await onSubmit({ email, password, full_name: fullName.trim() || undefined });
      if (mode === "register") { fireCannons(); setSuccess(true); }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverError) setFormError(serverError);
  }, [serverError]);

  const loginHeadlines = [
    "Your numbers are waiting.",
    "The dashboard missed you.",
    "Back for more clarity.",
  ];
  const headline = mode === "login"
    ? loginHeadlines[Math.floor(Date.now() / 86400000) % loginHeadlines.length]
    : "Start seeing the full picture.";

  const subline = mode === "login"
    ? "Sign in to your FinSight workspace and pick up right where you left off."
    : "Set up your financial analysis workspace in under a minute.";

  return (
    <div className="flex min-h-screen w-full flex-col bg-black text-white">
      <Confetti
        ref={confettiRef}
        className="pointer-events-none fixed inset-0 z-[999] h-full w-full"
        manualstart
      />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <GradientBackground />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5 p-6">
        <span className="flex size-9 items-center justify-center rounded-full bg-white text-black">
          <BarChart3 className="size-5" />
        </span>
        <span className="text-lg font-bold text-white">FinSight</span>
      </div>

      {/* Main */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-4">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              {headline}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/55">{subline}</p>
          </div>

          {/* Success state */}
          <AnimatePresence>
            {success && (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-4"
                initial={{ opacity: 0, scale: 0.95 }}
              >
                <PartyPopper className="h-6 w-6 shrink-0 text-purple-400" />
                <p className="text-base font-semibold text-white">Account created. Redirecting you now...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          <AnimatePresence>
            {formError && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0, y: -6 }}
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <p className="text-sm font-medium leading-6 text-red-300">{formError}</p>
                <button className="ml-auto shrink-0 text-red-400/60 hover:text-red-300" onClick={() => setFormError("")} type="button">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <GlassInput
                autoComplete="name"
                icon={<User className="h-5 w-5" />}
                id="full_name"
                label="Full name"
                onChange={setFullName}
                placeholder="Jordan Lee"
                value={fullName}
              />
            )}

            <GlassInput
              autoComplete="email"
              icon={<Mail className="h-5 w-5" />}
              id="email"
              label="Email"
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
              value={email}
            />

            <GlassInput
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              icon={<Lock className="h-5 w-5" />}
              id="password"
              label="Password"
              onChange={setPassword}
              placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
              rightSlot={
                <button
                  className="shrink-0 text-white/40 transition hover:text-white/80"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              type={showPassword ? "text" : "password"}
              value={password}
            />

            {mode === "register" && (
              <GlassInput
                autoComplete="new-password"
                icon={<Lock className="h-5 w-5" />}
                id="confirm_password"
                label="Confirm password"
                onChange={setConfirmPassword}
                placeholder="Repeat your password"
                rightSlot={
                  <button
                    className="shrink-0 text-white/40 transition hover:text-white/80"
                    onClick={() => setShowConfirm((v) => !v)}
                    type="button"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
              />
            )}

            <div className="pt-2">
              <SubmitButton disabled={success} loading={loading}>
                {mode === "login" ? "Sign in" : "Create account"}
              </SubmitButton>
            </div>
          </form>

          {/* Toggle link */}
          <p className="mt-6 text-center text-base text-white/45">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link className="font-semibold text-white transition hover:text-purple-300" href="/register">
                  Create one free
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link className="font-semibold text-white transition hover:text-purple-300" href="/login">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
