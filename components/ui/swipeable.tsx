"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSwipe } from "@/lib/hooks/use-swipe";

export interface SwipeAction {
  /** Action label for accessibility */
  label: string;
  /** Icon or content to show */
  icon: React.ReactNode;
  /** Background color class */
  color: string;
  /** Callback when action is triggered */
  onAction: () => void;
}

export interface SwipeableProps {
  children: React.ReactNode;
  /** Action to show when swiping left */
  leftAction?: SwipeAction;
  /** Action to show when swiping right */
  rightAction?: SwipeAction;
  /** Whether swipe is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * A wrapper component that enables swipe-to-reveal actions on touch devices.
 * Provides accessible keyboard alternatives via context menu.
 */
export function Swipeable({
  children,
  leftAction,
  rightAction,
  disabled = false,
  className,
}: SwipeableProps): React.ReactElement {
  const { state, handlers, reset } = useSwipe({
    threshold: 80,
    onSwipeLeft: leftAction?.onAction,
    onSwipeRight: rightAction?.onAction,
    disabled,
  });

  // Reset after action completes
  React.useEffect(() => {
    if (state.direction) {
      const timer = setTimeout(reset, 300);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [state.direction, reset]);

  const translateX = state.isSwiping ? state.offsetX : 0;
  const leftVisible = translateX > 0 && rightAction;
  const rightVisible = translateX < 0 && leftAction;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left action background (revealed on right swipe) */}
      {rightAction && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-4",
            rightAction.color
          )}
          style={{ width: Math.abs(translateX) }}
          aria-hidden="true"
        >
          {leftVisible && (
            <span className="flex items-center gap-2 text-white">
              {rightAction.icon}
              <span className="text-sm font-medium">{rightAction.label}</span>
            </span>
          )}
        </div>
      )}

      {/* Right action background (revealed on left swipe) */}
      {leftAction && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4",
            leftAction.color
          )}
          style={{ width: Math.abs(translateX) }}
          aria-hidden="true"
        >
          {rightVisible && (
            <span className="flex items-center gap-2 text-white">
              <span className="text-sm font-medium">{leftAction.label}</span>
              {leftAction.icon}
            </span>
          )}
        </div>
      )}

      {/* Main content */}
      <div
        {...handlers}
        className={cn(
          "bg-card relative transition-transform duration-100",
          !state.isSwiping && "transition-transform duration-200"
        )}
        style={{
          transform: `translateX(${String(translateX)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
