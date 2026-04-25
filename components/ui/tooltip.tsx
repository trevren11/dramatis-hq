"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const TooltipContext = React.createContext<{ delayDuration: number }>({
  delayDuration: 200,
});

export function TooltipProvider({
  children,
  delayDuration = 200,
}: TooltipProviderProps): React.ReactElement {
  return (
    <TooltipContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
}

interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { delayDuration } = React.useContext(TooltipContext);

  const handleMouseEnter = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => { setIsOpen(true); }, delayDuration);
  }, [delayDuration]);

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
  }, []);

  return (
    <TooltipStateContext.Provider
      value={{ isOpen, handleMouseEnter, handleMouseLeave }}
    >
      {children}
    </TooltipStateContext.Provider>
  );
}

const TooltipStateContext = React.createContext<{
  isOpen: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}>({
  isOpen: false,
  handleMouseEnter: () => {},
  handleMouseLeave: () => {},
});

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function TooltipTrigger({
  children,
  asChild,
}: TooltipTriggerProps): React.ReactElement {
  const { handleMouseEnter, handleMouseLeave } =
    React.useContext(TooltipStateContext);

  const child = asChild
    ? React.Children.only(children)
    : (children as React.ReactElement);

  if (asChild && React.isValidElement(child)) {
    return React.cloneElement(child, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </span>
  );
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
}

export function TooltipContent({
  children,
  className,
}: TooltipContentProps): React.ReactElement | null {
  const { isOpen } = React.useContext(TooltipStateContext);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "bg-popover text-popover-foreground absolute z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}
