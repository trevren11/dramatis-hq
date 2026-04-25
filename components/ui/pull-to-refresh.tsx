"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { usePullRefresh } from "@/lib/hooks/use-pull-refresh";
import { Loader2, ArrowDown } from "lucide-react";

export interface PullToRefreshProps {
  children: React.ReactNode;
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Whether pull to refresh is disabled */
  disabled?: boolean;
  /** Additional class name for the container */
  className?: string;
}

/**
 * A wrapper component that enables pull-to-refresh functionality.
 * Shows a spinner indicator when pulling down from the top of the content.
 */
export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: PullToRefreshProps): React.ReactElement {
  const { state, handlers } = usePullRefresh({
    threshold: 80,
    maxPull: 150,
    onRefresh,
    disabled,
  });

  const indicatorOpacity = Math.min(state.pullDistance / 80, 1);
  const indicatorScale = 0.5 + Math.min(state.pullDistance / 160, 0.5);

  return (
    <div className={cn("relative", className)} {...handlers}>
      {/* Pull indicator */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 items-center justify-center transition-opacity",
          state.pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: `${String(Math.max(state.pullDistance - 60, -60))}px`,
        }}
        aria-hidden="true"
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg",
            state.isTriggered && "bg-primary text-primary-foreground"
          )}
          style={{
            opacity: indicatorOpacity,
            transform: `scale(${String(indicatorScale)}) rotate(${String(state.pullDistance * 2)}deg)`,
          }}
        >
          {state.isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown
              className={cn("h-5 w-5 transition-transform", state.isTriggered && "rotate-180")}
            />
          )}
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${String(state.pullDistance)}px)`,
          transition:
            state.pullDistance === 0 && !state.isRefreshing ? "transform 0.2s ease-out" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
