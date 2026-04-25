"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NavItem } from "./sidebar";

export interface MobileNavProps {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ items, isOpen, onClose }: MobileNavProps): React.ReactElement {
  const pathname = usePathname();
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = React.useState<number | null>(null);
  const [isClosing, setIsClosing] = React.useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);

  // Close on route change
  React.useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Swipe to close
  const handleTouchStart = (e: React.TouchEvent): void => {
    const touch = e.touches[0];
    if (touch) {
      setTouchStart(touch.clientX);
      setTouchCurrent(touch.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (touchStart === null) return;
    const touch = e.touches[0];
    if (touch) {
      setTouchCurrent(touch.clientX);
    }
  };

  const handleTouchEnd = (): void => {
    if (touchStart === null || touchCurrent === null) return;

    const diff = touchStart - touchCurrent;
    // If swiped left more than 100px, close
    if (diff > 100) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 200);
    }

    setTouchStart(null);
    setTouchCurrent(null);
  };

  const translateX =
    touchStart !== null && touchCurrent !== null ? Math.min(0, touchCurrent - touchStart) : 0;

  if (!isOpen && !isClosing) {
    return <></>;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
          isOpen && !isClosing ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Navigation panel */}
      <div
        ref={navRef}
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col shadow-xl transition-transform duration-200 ease-out",
          isOpen && !isClosing ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          transform:
            translateX < 0
              ? `translateX(${String(translateX)}px)`
              : isOpen && !isClosing
                ? "translateX(0)"
                : "translateX(-100%)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="font-heading text-xl font-bold">
            <span className="text-primary">Dramatis</span>
            <span className="text-secondary">HQ</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4" aria-label="Main navigation">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted active:bg-muted"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="bg-secondary text-secondary-foreground ml-auto rounded-full px-2 py-0.5 text-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {item.children && (
                    <ul className="mt-1 ml-8 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              pathname === child.href
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {child.icon && <child.icon className="h-4 w-4" />}
                            <span>{child.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Swipe indicator */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <span className="opacity-50">Swipe left to close</span>
          </div>
        </div>
      </div>
    </>
  );
}
