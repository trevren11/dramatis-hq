"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithCredentials, loginWithGoogle } from "@/lib/auth/actions";
import { Loader2 } from "lucide-react";

interface SignupFormProps {
  userType: "talent" | "producer";
  title?: string;
  description?: string;
}

interface ApiErrorResponse {
  error?: string;
  details?: Record<string, string[]>;
}

export function SignupForm({ userType, title, description }: SignupFormProps): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    setFieldErrors({});

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, userType }),
        });

        const data = (await response.json()) as ApiErrorResponse;

        if (!response.ok) {
          if (data.details) {
            setFieldErrors(data.details);
          } else {
            setError(data.error ?? "Registration failed");
          }
          return;
        }

        // Auto-login after successful registration
        const loginResult = await loginWithCredentials(email, password, false, "/");
        if (loginResult.error) {
          router.push("/login?registered=true");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const handleGoogleSignUp = (): void => {
    startTransition(async () => {
      await loginWithGoogle("/");
    });
  };

  return (
    <>
      {(title ?? description) && (
        <div className="mb-6 text-center">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            required
            disabled={isPending}
          />
          {fieldErrors.name && <p className="text-destructive text-sm">{fieldErrors.name[0]}</p>}
        </div>

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
          {fieldErrors.email && <p className="text-destructive text-sm">{fieldErrors.email[0]}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
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
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
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
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">Or continue with</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isPending}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-muted-foreground mt-2 text-center text-sm">
        <Link href="/signup" className="text-primary hover:underline">
          ← Choose a different account type
        </Link>
      </p>
    </>
  );
}
