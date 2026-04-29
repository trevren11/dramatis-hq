"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/monitoring/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for wrapping sections of a page.
 * Shows a user-friendly error message while keeping the rest of the page functional.
 * Logs detailed errors server-side for debugging.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error with context
    logger.error("Section error boundary caught error", {
      error,
      componentStack: errorInfo.componentStack,
      sectionName: this.props.sectionName,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="border-border bg-muted/30 flex flex-col items-center justify-center rounded-lg border p-8 text-center">
          <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">
            {this.props.sectionName
              ? `${this.props.sectionName} temporarily unavailable`
              : "This feature is temporarily unavailable"}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            We&apos;re working on fixing this. Please try again later or contact support if the
            problem persists.
          </p>
          <Button variant="outline" onClick={this.handleRetry} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
