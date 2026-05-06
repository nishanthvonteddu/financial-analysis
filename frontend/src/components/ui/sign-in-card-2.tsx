"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, BarChart3, Eye, EyeClosed, Lock, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export interface SignInCard2Props {
  onCreateAccount?: () => void;
  onGoogleSignIn?: () => Promise<void>;
  onResetPassword?: (email: string) => void;
  onSignIn?: (data: { email: string; password: string; remember: boolean }) => Promise<void>;
  serverError?: string;
}

export function Component({
  onCreateAccount,
  onGoogleSignIn,
  onResetPassword,
  onSignIn,
  serverError,
}: SignInCard2Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(serverError ?? "");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (onSignIn) {
        await onSignIn({ email, password, remember: rememberMe });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!onGoogleSignIn) return;
    setError("");
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/40 via-purple-700/50 to-black" />

      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="absolute left-1/2 top-0 h-[60vh] w-[120vh] -translate-x-1/2 rounded-b-[50%] bg-purple-400/20 blur-[80px]" />
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [0.98, 1.02, 0.98],
        }}
        className="absolute left-1/2 top-0 h-[60vh] w-[100vh] -translate-x-1/2 rounded-b-full bg-purple-300/20 blur-[60px]"
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        className="absolute bottom-0 left-1/2 h-[90vh] w-[90vh] -translate-x-1/2 rounded-t-full bg-purple-400/20 blur-[60px]"
        transition={{
          delay: 1,
          duration: 6,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />

      <div className="absolute left-1/4 top-1/4 size-96 animate-pulse rounded-full bg-white/5 opacity-40 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 size-96 animate-pulse rounded-full bg-white/5 opacity-40 blur-[100px] delay-1000" />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        style={{ perspective: 1500 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="relative"
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          style={{ rotateX, rotateY }}
          whileHover={{ z: 10 }}
        >
          <div className="group relative">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                  "0 0 15px 5px rgba(255,255,255,0.05)",
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                ],
                opacity: [0.2, 0.4, 0.2],
              }}
              className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-70"
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />

            <div className="absolute -inset-px overflow-hidden rounded-2xl">
              <motion.div
                animate={{
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                }}
                className="absolute left-0 top-0 h-[3px] w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                transition={{
                  filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror" },
                  left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                }}
              />

              <motion.div
                animate={{
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                  opacity: [0.3, 0.7, 0.3],
                  top: ["-50%", "100%"],
                }}
                className="absolute right-0 top-0 h-1/2 w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                transition={{
                  filter: { delay: 0.6, duration: 1.5, repeat: Infinity, repeatType: "mirror" },
                  opacity: { delay: 0.6, duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                  top: { delay: 0.6, duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                }}
              />

              <motion.div
                animate={{
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                  opacity: [0.3, 0.7, 0.3],
                  right: ["-50%", "100%"],
                }}
                className="absolute bottom-0 right-0 h-[3px] w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                transition={{
                  filter: { delay: 1.2, duration: 1.5, repeat: Infinity, repeatType: "mirror" },
                  opacity: { delay: 1.2, duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                  right: { delay: 1.2, duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                }}
              />

              <motion.div
                animate={{
                  bottom: ["-50%", "100%"],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                  opacity: [0.3, 0.7, 0.3],
                }}
                className="absolute bottom-0 left-0 h-1/2 w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                transition={{
                  bottom: { delay: 1.8, duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  filter: { delay: 1.8, duration: 1.5, repeat: Infinity, repeatType: "mirror" },
                  opacity: { delay: 1.8, duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                }}
              />

              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                className="absolute left-0 top-0 size-[5px] rounded-full bg-white/40 blur-[1px]"
                transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
              />
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                className="absolute right-0 top-0 size-2 rounded-full bg-white/60 blur-[2px]"
                transition={{ delay: 0.5, duration: 2.4, repeat: Infinity, repeatType: "mirror" }}
              />
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                className="absolute bottom-0 right-0 size-2 rounded-full bg-white/60 blur-[2px]"
                transition={{ delay: 1, duration: 2.2, repeat: Infinity, repeatType: "mirror" }}
              />
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                className="absolute bottom-0 left-0 size-[5px] rounded-full bg-white/40 blur-[1px]"
                transition={{ delay: 1.5, duration: 2.3, repeat: Infinity, repeatType: "mirror" }}
              />
            </div>

            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.07] to-white/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-70" />

            <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)",
                  backgroundSize: "30px 30px",
                }}
              />

              <div className="mb-5 flex flex-col items-center gap-1 text-center">
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative mx-auto flex size-10 items-center justify-center overflow-hidden rounded-full border border-white/10"
                  initial={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.8, type: "spring" }}
                >
                  <BarChart3 className="size-5 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                </motion.div>

                <motion.h1
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent"
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.2 }}
                >
                  Welcome Back
                </motion.h1>

                <motion.p
                  animate={{ opacity: 1 }}
                  className="text-xs text-white/60"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Sign in to continue to FinSight
                </motion.p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  {error}
                </div>
              )}

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <motion.div className="flex flex-col gap-3">
                  <motion.div
                    className={cn("relative", focusedInput === "email" && "z-10")}
                    transition={{ damping: 25, stiffness: 400, type: "spring" }}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 transition-all duration-300 group-hover:opacity-100" />

                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail
                        className={cn(
                          "absolute left-3 size-4 transition-all duration-300",
                          focusedInput === "email" ? "text-white" : "text-white/40",
                        )}
                      />

                      <Input
                        autoComplete="email"
                        className="h-10 w-full border-transparent bg-white/5 pl-10 pr-3 text-white placeholder:text-white/30 transition-all duration-300 focus:border-white/20 focus:bg-white/10"
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        placeholder="Email address"
                        required
                        type="email"
                        value={email}
                      />

                      {focusedInput === "email" && (
                        <motion.div
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 -z-10 bg-white/5"
                          exit={{ opacity: 0 }}
                          initial={{ opacity: 0 }}
                          layoutId="input-highlight"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className={cn("relative", focusedInput === "password" && "z-10")}
                    transition={{ damping: 25, stiffness: 400, type: "spring" }}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 transition-all duration-300 group-hover:opacity-100" />

                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock
                        className={cn(
                          "absolute left-3 size-4 transition-all duration-300",
                          focusedInput === "password" ? "text-white" : "text-white/40",
                        )}
                      />

                      <Input
                        autoComplete="current-password"
                        className="h-10 w-full border-transparent bg-white/5 pl-10 pr-10 text-white placeholder:text-white/30 transition-all duration-300 focus:border-white/20 focus:bg-white/10"
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput("password")}
                        placeholder="Password"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />

                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 cursor-pointer text-white/40 transition-colors duration-300 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? <Eye className="size-4" /> : <EyeClosed className="size-4" />}
                      </button>

                      {focusedInput === "password" && (
                        <motion.div
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 -z-10 bg-white/5"
                          exit={{ opacity: 0 }}
                          initial={{ opacity: 0 }}
                          layoutId="input-highlight"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>
                </motion.div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex size-4">
                      <input
                        checked={rememberMe}
                        className="size-4 appearance-none rounded border border-white/20 bg-white/5 transition-all duration-200 checked:border-white checked:bg-white focus:outline-none focus:ring-1 focus:ring-white/30"
                        id="remember-me"
                        name="remember-me"
                        onChange={() => setRememberMe(!rememberMe)}
                        type="checkbox"
                      />
                      {rememberMe && (
                        <motion.div
                          animate={{ opacity: 1, scale: 1 }}
                          className="pointer-events-none absolute inset-0 flex items-center justify-center text-black"
                          initial={{ opacity: 0, scale: 0.5 }}
                        >
                          <svg
                            fill="none"
                            height="12"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            width="12"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <label className="text-xs text-white/60 transition-colors duration-200 hover:text-white/80" htmlFor="remember-me">
                      Remember me
                    </label>
                  </div>

                  <button
                    className="text-xs text-white/60 transition-colors duration-200 hover:text-white"
                    onClick={() => onResetPassword?.(email)}
                    type="button"
                  >
                    Forgot password?
                  </button>
                </div>

                <motion.button
                  className="group/button relative mt-1 w-full"
                  disabled={isLoading}
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-70" />

                  <div className="relative flex h-10 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-black transition-all duration-300">
                    <motion.div
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      className="absolute inset-0 -z-10 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                      style={{
                        opacity: isLoading ? 1 : 0,
                        transition: "opacity 0.3s ease",
                      }}
                      transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />

                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center"
                          exit={{ opacity: 0 }}
                          initial={{ opacity: 0 }}
                          key="loading"
                        >
                          <div className="size-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                        </motion.div>
                      ) : (
                        <motion.span
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center gap-1 text-sm font-medium"
                          exit={{ opacity: 0 }}
                          initial={{ opacity: 0 }}
                          key="button-text"
                        >
                          Sign In
                          <ArrowRight className="size-3 transition-transform duration-300 group-hover/button:translate-x-1" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {onGoogleSignIn && (
                  <>
                    <div className="my-1 flex items-center">
                      <div className="flex-grow border-t border-white/5" />
                      <motion.span
                        animate={{ opacity: [0.7, 0.9, 0.7] }}
                        className="mx-3 text-xs text-white/40"
                        initial={{ opacity: 0.7 }}
                        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                      >
                        or
                      </motion.span>
                      <div className="flex-grow border-t border-white/5" />
                    </div>

                    <motion.button
                      className="group/google relative w-full"
                      disabled={googleLoading}
                      onClick={handleGoogle}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 rounded-lg bg-white/5 opacity-0 blur transition-opacity duration-300 group-hover/google:opacity-70" />

                      <div className="relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-white/5 font-medium text-white transition-all duration-300 hover:border-white/20">
                        {googleLoading ? (
                          <div className="size-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                        ) : (
                          <div className="flex size-4 items-center justify-center text-white/80 transition-colors duration-300 group-hover/google:text-white">
                            G
                          </div>
                        )}

                        <span className="text-xs text-white/80 transition-colors group-hover/google:text-white">
                          Sign in with Google
                        </span>

                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
                          initial={{ x: "-100%" }}
                          transition={{
                            duration: 1,
                            ease: "easeInOut",
                          }}
                          whileHover={{ x: "100%" }}
                        />
                      </div>
                    </motion.button>
                  </>
                )}

                <motion.p
                  animate={{ opacity: 1 }}
                  className="mt-1 text-center text-xs text-white/60"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Don&apos;t have an account?{" "}
                  {onCreateAccount ? (
                    <button className="group/signup relative inline-block" onClick={onCreateAccount} type="button">
                      <span className="relative z-10 font-medium text-white transition-colors duration-300 group-hover/signup:text-white/70">
                        Sign up
                      </span>
                      <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-300 group-hover/signup:w-full" />
                    </button>
                  ) : (
                    <Link className="group/signup relative inline-block" href="/register">
                      <span className="relative z-10 font-medium text-white transition-colors duration-300 group-hover/signup:text-white/70">
                        Sign up
                      </span>
                      <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-300 group-hover/signup:w-full" />
                    </Link>
                  )}
                </motion.p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

