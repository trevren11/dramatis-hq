"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface ApiErrorResponse {
  error?: string;
  details?: Record<string, string[]>;
}

export function ResetPasswordForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <div className="text-center">
        <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">Invalid Reset Link</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="text-primary text-sm hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    setFieldErrors({});

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });

        const data = (await response.json()) as ApiErrorResponse;

        if (!response.ok) {
          if (data.details) {
            setFieldErrors(data.details);
          } else {
            setError(data.error ?? "Something went wrong");
          }
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/login?reset=true");
        }, 2000);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="text-primary mx-auto mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">Password Reset Successfully</h3>
        <p className="text-muted-foreground mb-4 text-sm">Redirecting you to the login page...</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
      )}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          New Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter new password"
          required
          disabled={isPending}
        />
        {fieldErrors.password && (
          <p className="text-destructive text-sm">{fieldErrors.password[0]}</p>
        )}
        <p className="text-muted-foreground text-xs">
          Must be at least 8 characters with uppercase, lowercase, and a number
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm New Password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          required
          disabled={isPending}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-destructive text-sm">{fieldErrors.confirmPassword[0]}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
}
