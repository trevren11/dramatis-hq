"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface OfflineIndicatorProps {
  /** Position of the indicator */
  position?: "top" | "bottom";
  /** Additional class name */
  className?: string;
}

/**
 * A banner component that shows when the user is offline.
 * Automatically detects online/offline status using the Navigator API.
 */
export function OfflineIndicator({
  position = "top",
  className,
}: OfflineIndicatorProps): React.ReactElement | null {
  const [isOnline, setIsOnline] = React.useState(true);
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // Set initial state
    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine);

    const handleOnline = (): void => {
      setIsOnline(true);
      // Show "back online" briefly, then hide
      setTimeout(() => {
        setShowBanner(false);
      }, 2000);
    };

    const handleOffline = (): void => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = (): void => {
    // Try to reload the page to check connectivity
    window.location.reload();
  };

  if (!showBanner) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed right-0 left-0 z-50 flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-white transition-transform duration-300",
        position === "top" ? "top-0" : "bottom-0",
        // Safe area padding
        position === "top"
          ? "pt-[max(0.75rem,env(safe-area-inset-top))]"
          : "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        isOnline ? "bg-green-600" : "bg-amber-600",
        className
      )}
    >
      {isOnline ? (
        <>
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You are offline</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="ml-2 h-7 gap-1 bg-white/20 px-2 text-white hover:bg-white/30"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
