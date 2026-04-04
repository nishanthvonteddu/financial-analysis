"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useAuth();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(searchParams.get("next") ?? "/dashboard");
    }
  }, [isAuthenticated, router, searchParams]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      router.replace(searchParams.get("next") ?? "/dashboard");
    } catch {
      setError("root", {
        message: "The email or password did not match an active account.",
      });
    }
  });

  return (
    <AuthShell
      alternateHref="/register"
      alternateLabel="Create account"
      alternateText="Need access?"
      description="Sign in to reach the protected dashboard, keep the session fresh in memory, and continue straight into the working app."
      eyebrow="Day 2 authentication"
      title="Return to your subscription workspace."
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="h-12 w-full border-b border-black/15 bg-transparent px-0 text-base text-ink outline-none transition-colors placeholder:text-black/35 focus:border-ember"
            placeholder="owner@example.com"
            {...register("email")}
          />
          {errors.email ? <p className="text-sm text-ember">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-12 w-full border-b border-black/15 bg-transparent px-0 text-base text-ink outline-none transition-colors placeholder:text-black/35 focus:border-ember"
            placeholder="At least 8 characters"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-ember">{errors.password.message}</p>
          ) : null}
        </div>

        {errors.root ? <p className="text-sm text-ember">{errors.root.message}</p> : null}

        <Button className="group w-full justify-between rounded-full px-6" disabled={isSubmitting} type="submit">
          <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Button>

        <p className="text-sm leading-6 text-black/55">
          New here?{" "}
          <Link className="font-medium text-ink transition-colors hover:text-ember" href="/register">
            Create your account
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[hsl(var(--background))]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
