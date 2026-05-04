"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Eye, EyeOff, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

export interface SignInPageProps {
  title?: string;
  description?: string;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn: (data: { email: string; password: string; remember: boolean }) => Promise<void>;
  onGoogleSignIn?: () => Promise<void>;
  onResetPassword?: (email: string) => void;
  onCreateAccount?: () => void;
  serverError?: string;
}

function GlassInputWrapper({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150",
          "border-border bg-foreground/5 backdrop-blur-sm",
          "focus-within:border-violet-400/70 focus-within:bg-foreground/[0.07]",
          error && "border-red-400/60",
        )}
      >
        {children}
      </div>
      {error && <p className="text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}

export function SignInPage({
  title = "Welcome back",
  description = "Sign in to your FinSight workspace.",
  heroImageSrc = "/financial-dashboard-reference.jpg",
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  serverError,
}: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (serverError) setError(serverError);
  }, [serverError]);

  const validate = () => {
    let ok = true;
    setEmailError("");
    setPasswordError("");
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Enter a valid email."); ok = false; }
    if (password.length < 1) { setPasswordError("Password is required."); ok = false; }
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await onSignIn({ email, password, remember });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!onGoogleSignIn) return;
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-black text-white">
      {/* Left — form panel */}
      <div className="relative z-10 flex w-full flex-col justify-center px-6 py-12 md:w-1/2 md:px-12 lg:px-20">
        {/* Logo */}
        <div className="animate-element mb-10 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-white text-black">
            <BarChart3 className="size-5" />
          </span>
          <span className="text-lg font-bold text-white">FinSight</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="animate-element animate-delay-100 mb-8">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/50">{description}</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="animate-element mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="animate-element animate-delay-200">
              <label className="mb-1.5 block text-sm font-medium text-white/60" htmlFor="email">
                Email
              </label>
              <GlassInputWrapper error={emailError}>
                <input
                  autoComplete="email"
                  className="flex-1 bg-transparent text-base font-medium text-white placeholder:text-white/25 focus:outline-none"
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </GlassInputWrapper>
            </div>

            {/* Password */}
            <div className="animate-element animate-delay-300">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-white/60" htmlFor="password">
                  Password
                </label>
                {onResetPassword && (
                  <button
                    className="text-xs text-white/40 transition hover:text-violet-300"
                    onClick={() => onResetPassword(email)}
                    type="button"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <GlassInputWrapper error={passwordError}>
                <input
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-base font-medium text-white placeholder:text-white/25 focus:outline-none"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="shrink-0 text-white/35 transition hover:text-white/70"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </GlassInputWrapper>
            </div>

            {/* Remember me */}
            <div className="animate-element animate-delay-400 flex items-center gap-2.5">
              <div className="custom-checkbox relative flex items-center">
                <input
                  checked={remember}
                  className="peer sr-only"
                  id="remember"
                  onChange={(e) => setRemember(e.target.checked)}
                  type="checkbox"
                />
                <label
                  className={cn(
                    "flex size-4 cursor-pointer items-center justify-center rounded border transition-all duration-150",
                    remember
                      ? "border-violet-500 bg-violet-500"
                      : "border-white/20 bg-white/5 hover:border-white/40",
                  )}
                  htmlFor="remember"
                >
                  {remember && (
                    <svg className="size-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </label>
              </div>
              <label className="cursor-pointer select-none text-sm text-white/50" htmlFor="remember">
                Keep me signed in
              </label>
            </div>

            {/* Submit */}
            <div className="animate-element animate-delay-500 pt-1">
              <button
                className={cn(
                  "w-full rounded-xl px-6 py-3.5 text-base font-semibold transition-all duration-150",
                  "bg-white text-black hover:bg-white/92 active:scale-[0.99]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                )}
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="size-4 animate-spin" /> Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>

            {/* Divider */}
            {onGoogleSignIn && (
              <div className="animate-element animate-delay-600 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/30">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            )}

            {/* Google */}
            {onGoogleSignIn && (
              <div className="animate-element animate-delay-700">
                <button
                  className={cn(
                    "flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-white/80 transition-all duration-150",
                    "bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-[0.99]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                  disabled={googleLoading}
                  onClick={handleGoogle}
                  type="button"
                >
                  {googleLoading ? (
                    <Loader className="size-4 animate-spin" />
                  ) : (
                    <svg className="size-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </div>
            )}
          </form>

          {/* Create account link */}
          <p className="animate-element animate-delay-800 mt-8 text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            {onCreateAccount ? (
              <button
                className="font-semibold text-white transition hover:text-violet-300"
                onClick={onCreateAccount}
                type="button"
              >
                Create one free
              </button>
            ) : (
              <Link className="font-semibold text-white transition hover:text-violet-300" href="/register">
                Create one free
              </Link>
            )}
          </p>
        </div>
      </div>

      {/* Right — hero panel (hidden on mobile) */}
      <div className="animate-slide-right relative hidden overflow-hidden md:block md:w-1/2">
        {/* Background image */}
        <Image
          alt="FinSight financial intelligence dashboard"
          className="h-full w-full object-cover"
          fill
          priority
          src={heroImageSrc}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Gradient overlay — bottom fade for testimonials */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-8">
            {testimonials.map((t, i) => (
              <div
                className={cn(
                  "animate-testimonial rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md",
                  i === 0 && "animate-delay-200",
                  i === 1 && "animate-delay-400",
                  i === 2 && "animate-delay-600",
                )}
                key={i}
              >
                <p className="text-sm leading-relaxed text-white/85">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-2.5 flex items-center gap-2.5">
                  {t.avatar && (
                    <Image
                      alt={t.author}
                      className="rounded-full object-cover"
                      height={28}
                      src={t.avatar}
                      width={28}
                    />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-white">{t.author}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
