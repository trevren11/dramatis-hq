"use client";

import { useState, useRef, useCallback, type RefObject } from "react";

export interface SwipeState {
  /** Current horizontal offset during swipe */
  offsetX: number;
  /** Whether a swipe is in progress */
  isSwiping: boolean;
  /** Direction of completed swipe */
  direction: "left" | "right" | null;
}

export interface UseSwipeOptions {
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  threshold?: number;
  /** Maximum vertical movement before canceling swipe (default: 100) */
  maxVertical?: number;
  /** Callback when swiped left */
  onSwipeLeft?: () => void;
  /** Callback when swiped right */
  onSwipeRight?: () => void;
  /** Whether swipe is disabled */
  disabled?: boolean;
}

export interface UseSwipeResult {
  /** Ref to attach to the swipeable element */
  ref: RefObject<HTMLDivElement | null>;
  /** Current swipe state */
  state: SwipeState;
  /** Touch event handlers */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  /** Reset the swipe state */
  reset: () => void;
}

/**
 * Hook for detecting horizontal swipe gestures
 */
export function useSwipe(options: UseSwipeOptions = {}): UseSwipeResult {
  const {
    threshold = 50,
    maxVertical = 100,
    onSwipeLeft,
    onSwipeRight,
    disabled = false,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    isSwiping: false,
    direction: null,
  });

  const reset = useCallback(() => {
    setState({ offsetX: 0, isSwiping: false, direction: null });
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      if (!touch) return;

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      setState((prev) => ({ ...prev, isSwiping: true, direction: null }));
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !state.isSwiping) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // Cancel swipe if too much vertical movement
      if (deltaY > maxVertical) {
        reset();
        return;
      }

      setState((prev) => ({ ...prev, offsetX: deltaX }));
    },
    [disabled, state.isSwiping, maxVertical, reset]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || !state.isSwiping) return;

    const { offsetX } = state;

    if (Math.abs(offsetX) >= threshold) {
      if (offsetX < 0) {
        setState({ offsetX: 0, isSwiping: false, direction: "left" });
        onSwipeLeft?.();
      } else {
        setState({ offsetX: 0, isSwiping: false, direction: "right" });
        onSwipeRight?.();
      }
    } else {
      reset();
    }
  }, [disabled, state, threshold, onSwipeLeft, onSwipeRight, reset]);

  return {
    ref,
    state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
  };
}
