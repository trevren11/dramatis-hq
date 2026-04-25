"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface StickyFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Show border above the footer */
  showBorder?: boolean;
  /** Background style */
  variant?: "solid" | "blur";
}

/**
 * A sticky footer component for mobile forms.
 * Sticks to the bottom of the viewport on mobile, with safe area insets.
 * On desktop, renders inline at the end of the form.
 */
export function StickyFooter({
  children,
  className,
  showBorder = true,
  variant = "solid",
  ...props
}: StickyFooterProps): React.ReactElement {
  return (
    <div
      className={cn(
        // Mobile: sticky to bottom
        "sticky bottom-0 z-10 -mx-4 px-4 py-3",
        // Safe area padding for notched devices
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        // Background
        variant === "solid" && "bg-background",
        variant === "blur" &&
          "bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur",
        // Border
        showBorder && "border-t",
        // Desktop: inline with proper spacing
        "md:static md:mx-0 md:border-t-0 md:bg-transparent md:px-0 md:pt-4 md:pb-0 md:backdrop-blur-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
