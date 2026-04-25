"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

export interface SidebarProps {
  className?: string;
  items: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
}

function NavItemComponent({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}): React.ReactElement {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{item.title}</span>
      {item.badge && (
        <span className="bg-secondary text-secondary-foreground ml-auto rounded-full px-2 py-0.5 text-xs">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  className,
  items,
  isOpen = true,
  onClose,
}: SidebarProps): React.ReactElement {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "bg-card fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 shrink-0 border-r transition-transform duration-200 ease-in-out md:sticky md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto py-4">
          <nav className="flex-1 space-y-1 px-3" aria-label="Sidebar navigation">
            {items.map((item) => (
              <React.Fragment key={item.href}>
                <NavItemComponent item={item} isActive={pathname === item.href} />
                {item.children && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.children.map((child) => (
                      <NavItemComponent
                        key={child.href}
                        item={child}
                        isActive={pathname === child.href}
                      />
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
