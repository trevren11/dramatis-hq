"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle } from "lucide-react";

interface ApiErrorResponse {
  error?: string;
}

export function ForgotPasswordForm(): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    setSuccess(false);

    const email = formData.get("email") as string;

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const data = (await response.json()) as ApiErrorResponse;
          setError(data.error ?? "Something went wrong");
          return;
        }

        setSuccess(true);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="text-primary mx-auto mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">Check your email</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          If an account with that email exists, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login" className="text-primary text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
