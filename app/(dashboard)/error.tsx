"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the dashboard route group.
 * Provides a user-friendly error page while keeping navigation accessible.
 */
export default function DashboardError({ error, reset }: DashboardErrorProps): React.ReactElement {
  useEffect(() => {
    // Log to Sentry for monitoring
    Sentry.captureException(error);
  }, [error]);

  // Check if this might be a database schema error
  const isSchemaError =
    error.message.includes("column") ||
    error.message.includes("relation") ||
    error.message.includes("does not exist") ||
    error.message.includes("undefined");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="bg-destructive/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>

        <p className="text-muted-foreground mx-auto mt-3 max-w-md">
          {isSchemaError
            ? "This feature is temporarily unavailable while we perform maintenance. Please try again in a few minutes."
            : "We encountered an unexpected error. Our team has been notified and is working on a fix."}
        </p>

        {error.digest && (
          <p className="text-muted-foreground mt-2 text-sm">Reference: {error.digest}</p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="/settings">
              <HelpCircle className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Debug info in development only */}
        {process.env.NODE_ENV !== "production" && (
          <details className="text-muted-foreground mt-8 text-left text-sm">
            <summary className="cursor-pointer hover:underline">Debug info (dev only)</summary>
            <pre className="bg-muted mt-2 max-w-2xl overflow-auto rounded-lg p-4 text-xs">
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
