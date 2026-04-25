import {
  Home,
  Film,
  Users,
  Calendar,
  FileText,
  Bell,
  Settings,
  PlusCircle,
  ClipboardList,
  BarChart3,
  UserPlus,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

export const producerNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/producer",
    icon: Home,
  },
  {
    title: "Projects",
    href: "/producer/projects",
    icon: Film,
    children: [
      {
        title: "Create Project",
        href: "/producer/projects/new",
        icon: PlusCircle,
      },
      {
        title: "Active Projects",
        href: "/producer/projects/active",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "Casting",
    href: "/producer/castings",
    icon: Users,
    badge: "5 pending",
  },
  {
    title: "Talent Pool",
    href: "/producer/talent",
    icon: Users,
  },
  {
    title: "Staff",
    href: "/producer/staff",
    icon: UserPlus,
  },
  {
    title: "Schedule",
    href: "/producer/schedule",
    icon: Calendar,
  },
  {
    title: "Reports",
    href: "/producer/reports",
    icon: BarChart3,
  },
  {
    title: "Contracts",
    href: "/producer/contracts",
    icon: FileText,
  },
  {
    title: "Notifications",
    href: "/producer/notifications",
    icon: Bell,
    badge: "8",
  },
  {
    title: "Settings",
    href: "/producer/settings",
    icon: Settings,
  },
];
