"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar, type NavItem } from "./sidebar";
import { Footer } from "./footer";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  navItems: NavItem[];
  showFooter?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function DashboardLayout({
  children,
  className,
  navItems,
  showFooter = false,
  user,
}: DashboardLayoutProps): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="bg-background min-h-screen">
      <Header
        user={user}
        onMenuClick={() => {
          setSidebarOpen(!sidebarOpen);
        }}
        showMobileMenu={sidebarOpen}
      />

      <div className="flex">
        <Sidebar
          items={navItems}
          isOpen={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
          }}
        />

        <main className={cn("flex-1", className)}>
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
          {showFooter && <Footer />}
        </main>
      </div>
    </div>
  );
}
