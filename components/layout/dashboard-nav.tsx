"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Calendar,
  MessageSquare,
  Bell,
  User,
  Briefcase,
  Music,
  Building2,
  Users,
  ClipboardList,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const talentNavItems: NavItem[] = [
  { label: "Find Auditions", href: "/auditions", icon: Search },
  { label: "My Applications", href: "/talent/applications", icon: Briefcase },
  { label: "My Profile", href: "/talent/profile", icon: User },
  { label: "Calendar", href: "/talent/calendar", icon: Calendar },
  { label: "Materials", href: "/talent/materials", icon: Music },
  { label: "Resume", href: "/talent/resume", icon: FileText },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

const producerNavItems: NavItem[] = [
  { label: "Shows", href: "/producer/shows", icon: Building2 },
  { label: "Auditions", href: "/producer/auditions", icon: ClipboardList },
  { label: "Talent Search", href: "/producer/talent-search", icon: Search },
  { label: "Staff", href: "/producer/staff", icon: Users },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

interface DashboardNavProps {
  userRole?: string | null;
}

export function DashboardNav({ userRole }: DashboardNavProps): React.ReactElement {
  const pathname = usePathname();
  const navItems = userRole === "producer" ? producerNavItems : talentNavItems;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Main navigation">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
      <Link
        href="/settings"
        className={cn(
          "ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
          pathname.startsWith("/settings")
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Settings</span>
      </Link>
    </nav>
  );
}
