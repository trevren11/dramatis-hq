"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Search, Calendar, MessageSquare, User } from "lucide-react";

export interface BottomNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const defaultItems: BottomNavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Auditions", href: "/auditions", icon: Search },
  { title: "Calendar", href: "/talent/calendar", icon: Calendar },
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Profile", href: "/talent/profile", icon: User },
];

export interface BottomNavProps {
  items?: BottomNavItem[];
  className?: string;
}

export function BottomNav({ items = defaultItems, className }: BottomNavProps): React.ReactElement {
  const pathname = usePathname();
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  // Hide bottom nav when keyboard is open on mobile
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const handleResize = (): void => {
      // If viewport height is significantly less than window height, keyboard is likely open
      const keyboardOpen = viewport.height < window.innerHeight * 0.75;
      setIsKeyboardOpen(keyboardOpen);
    };

    viewport.addEventListener("resize", handleResize);
    return () => {
      viewport.removeEventListener("resize", handleResize);
    };
  }, []);

  if (isKeyboardOpen) {
    return <></>;
  }

  return (
    <nav
      className={cn(
        "bg-card/95 supports-[backdrop-filter]:bg-card/60 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur md:hidden",
        // Safe area inset for notched devices
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
      aria-label="Bottom navigation"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-xs transition-colors",
                // Touch-friendly 44px minimum
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:bg-muted"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>
              <span className={cn("font-medium", isActive && "text-primary")}>{item.title}</span>
              {isActive && (
                <span className="bg-primary absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
