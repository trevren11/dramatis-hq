"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar, type NavItem } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Footer } from "./footer";
import { SkipLink } from "@/components/ui/skip-link";
import { BottomNav, type BottomNavItem } from "@/components/ui/bottom-nav";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  navItems: NavItem[];
  bottomNavItems?: BottomNavItem[];
  showFooter?: boolean;
  showBottomNav?: boolean;
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
  bottomNavItems,
  showFooter = false,
  showBottomNav = true,
  user,
}: DashboardLayoutProps): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="bg-background min-h-screen">
      <SkipLink />
      <Header
        user={user}
        onMenuClick={() => {
          setSidebarOpen(!sidebarOpen);
        }}
        showMobileMenu={sidebarOpen}
      />

      {/* Mobile navigation drawer */}
      <MobileNav
        items={navItems}
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
        }}
      />

      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <Sidebar
          items={navItems}
          isOpen={true}
          onClose={() => {
            setSidebarOpen(false);
          }}
          className="hidden md:block"
        />

        <main
          id="main-content"
          className={cn(
            "flex-1",
            // Add bottom padding for mobile bottom nav
            showBottomNav && "pb-16 md:pb-0",
            className
          )}
        >
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
          {showFooter && <Footer />}
        </main>
      </div>

      {/* Bottom navigation - mobile only */}
      {showBottomNav && <BottomNav items={bottomNavItems} />}
    </div>
  );
}
