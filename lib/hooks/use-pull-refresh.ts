"use client";

import { useState, useRef, useCallback } from "react";

export interface PullRefreshState {
  /** Current pull distance in pixels */
  pullDistance: number;
  /** Whether pull threshold has been reached */
  isTriggered: boolean;
  /** Whether refresh is in progress */
  isRefreshing: boolean;
}

export interface UsePullRefreshOptions {
  /** Distance in pixels required to trigger refresh (default: 80) */
  threshold?: number;
  /** Maximum pull distance (default: 150) */
  maxPull?: number;
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Whether pull to refresh is disabled */
  disabled?: boolean;
}

export interface UsePullRefreshResult {
  /** Current pull refresh state */
  state: PullRefreshState;
  /** Touch event handlers */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

/**
 * Hook for implementing pull-to-refresh functionality
 */
export function usePullRefresh(options: UsePullRefreshOptions): UsePullRefreshResult {
  const { threshold = 80, maxPull = 150, onRefresh, disabled = false } = options;

  const touchStartY = useRef<number>(0);
  const isAtTop = useRef<boolean>(false);
  const [state, setState] = useState<PullRefreshState>({
    pullDistance: 0,
    isTriggered: false,
    isRefreshing: false,
  });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || state.isRefreshing) return;
      const touch = e.touches[0];
      if (!touch) return;

      // Check if scrolled to top
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      isAtTop.current = scrollTop <= 0;
      touchStartY.current = touch.clientY;
    },
    [disabled, state.isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || state.isRefreshing || !isAtTop.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - touchStartY.current;

      // Only track downward pulls when at top
      if (deltaY > 0) {
        // Apply resistance as pull increases
        const resistance = 0.5;
        const adjustedDelta = Math.min(deltaY * resistance, maxPull);

        setState({
          pullDistance: adjustedDelta,
          isTriggered: adjustedDelta >= threshold,
          isRefreshing: false,
        });

        // Prevent default scroll when pulling
        if (adjustedDelta > 0) {
          e.preventDefault();
        }
      }
    },
    [disabled, state.isRefreshing, threshold, maxPull]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || state.isRefreshing) return;

    if (state.isTriggered) {
      setState((prev) => ({ ...prev, isRefreshing: true, pullDistance: threshold }));

      void onRefresh().finally(() => {
        setState({ pullDistance: 0, isTriggered: false, isRefreshing: false });
      });
    } else {
      setState({ pullDistance: 0, isTriggered: false, isRefreshing: false });
    }
  }, [disabled, state.isRefreshing, state.isTriggered, threshold, onRefresh]);

  return {
    state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
