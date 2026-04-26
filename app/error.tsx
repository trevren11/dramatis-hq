"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-gray-600">We encountered an error while processing your request.</p>
        {error.digest && <p className="mt-2 text-sm text-gray-500">Error ID: {error.digest}</p>}
        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-4 max-w-xl overflow-auto rounded bg-red-50 p-4 text-left text-xs text-red-800">
            {error.message}
            {"\n"}
            {error.stack}
          </pre>
        )}
        {/* Debug: always show error in limbo for now */}
        <details className="mt-4 text-left text-sm">
          <summary className="cursor-pointer text-gray-500">Debug info</summary>
          <pre className="mt-2 max-w-xl overflow-auto rounded bg-gray-100 p-2 text-xs">
            {error.message}
          </pre>
        </details>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Try again
          </button>
          <Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
