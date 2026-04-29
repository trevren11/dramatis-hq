"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the auth route group (login, signup, etc.).
 * Keeps the auth flow accessible even when other parts of the system have issues.
 */
export default function AuthError({ error, reset }: AuthErrorProps): React.ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive h-6 w-6" />
        </div>
        <CardTitle>Unable to Load</CardTitle>
        <CardDescription>
          We&apos;re experiencing temporary difficulties. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error.digest && (
          <p className="text-muted-foreground text-center text-xs">Reference: {error.digest}</p>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <details className="text-muted-foreground text-xs">
            <summary className="cursor-pointer">Debug info</summary>
            <pre className="bg-muted mt-2 overflow-auto rounded p-2">{error.message}</pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
