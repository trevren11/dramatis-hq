"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bell, Shield, Lock, Palette, UserCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsNavItems: NavItem[] = [
  {
    title: "Account",
    href: "/settings/account",
    icon: User,
    description: "Manage your account details",
  },
  {
    title: "Profile",
    href: "/settings/profile",
    icon: UserCircle,
    description: "Control your profile visibility",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Configure notification preferences",
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: Shield,
    description: "Manage your data and privacy",
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Lock,
    description: "Protect your account",
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
    description: "Customize your experience",
  },
];

export function SettingsNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Settings navigation">
      {settingsNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.title}</span>
            </div>
            {isActive && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsMobileNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <div className="border-b pb-4 md:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {settingsNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
