import {
  Home,
  Search,
  Calendar,
  User,
  FileText,
  Bell,
  Settings,
  Star,
  Briefcase,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

export const talentNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/talent",
    icon: Home,
  },
  {
    title: "Browse Auditions",
    href: "/talent/auditions",
    icon: Search,
    badge: "12 new",
  },
  {
    title: "My Applications",
    href: "/talent/applications",
    icon: FileText,
  },
  {
    title: "Schedule",
    href: "/talent/schedule",
    icon: Calendar,
  },
  {
    title: "My Profile",
    href: "/talent/profile",
    icon: User,
    children: [
      {
        title: "Portfolio",
        href: "/talent/profile/portfolio",
        icon: Star,
      },
      {
        title: "Experience",
        href: "/talent/profile/experience",
        icon: Briefcase,
      },
    ],
  },
  {
    title: "Notifications",
    href: "/talent/notifications",
    icon: Bell,
    badge: "3",
  },
  {
    title: "Settings",
    href: "/talent/settings",
    icon: Settings,
  },
];
