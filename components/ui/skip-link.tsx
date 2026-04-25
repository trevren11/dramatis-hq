"use client";

import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * SkipLink component for keyboard users to bypass navigation.
 * Becomes visible on focus, allowing users to skip directly to main content.
 */
export function SkipLink({
  href = "#main-content",
  children = "Skip to main content",
  className,
}: SkipLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      className={cn(
        "bg-primary text-primary-foreground fixed top-4 left-4 z-[100] rounded-md px-4 py-2 font-medium",
        "opacity-0 focus:opacity-100",
        "-translate-y-16 focus:translate-y-0",
        "transition-all duration-200",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
    >
      {children}
    </a>
  );
}
