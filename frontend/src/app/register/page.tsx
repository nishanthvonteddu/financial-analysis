"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type RegisterValues = z.infer<typeof registerSchema>;

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "A user with that email already exists.") {
    return "That account already exists or could not be created right now.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "That account already exists or could not be created right now.";
}

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, register: registerAccount } = useAuth();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerAccount(values);
      toast.success("Account created.");
      router.replace("/dashboard");
    } catch (error) {
      const message = getRegisterErrorMessage(error);
      toast.error(message);
      setError("root", {
        message,
      });
    }
  });

  return (
    <AuthShell
      alternateHref="/login"
      alternateLabel="Sign in"
      alternateText="Already have an account?"
      description="Create a clean in-memory session, move through protected routes immediately, and keep renewals visible from the first authenticated screen."
      eyebrow="Day 2 authentication"
      title="Open a secure workspace in under a minute."
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            className="h-12 w-full border-b border-black/15 bg-transparent px-0 text-base text-ink outline-none transition-colors placeholder:text-black/35 focus:border-ember"
            placeholder="Jordan Lee"
            {...register("full_name")}
          />
          {errors.full_name ? (
            <p className="text-sm text-ember">{errors.full_name.message}</p>
          ) : null}
        </div>

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
            autoComplete="new-password"
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
          <span>{isSubmitting ? "Creating account..." : "Create account"}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Button>

        <p className="text-sm leading-6 text-black/55">
          Have an account already?{" "}
          <Link className="font-medium text-ink transition-colors hover:text-ember" href="/login">
            Sign in
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
