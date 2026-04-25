"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mt-4 text-gray-600">
              We apologize for the inconvenience. Our team has been notified.
            </p>
            {error.digest && <p className="mt-2 text-sm text-gray-500">Error ID: {error.digest}</p>}
            <button
              onClick={reset}
              className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
