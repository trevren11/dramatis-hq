"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Bell, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function Header({
  className,
  onMenuClick,
  showMobileMenu = false,
  user,
}: HeaderProps): React.ReactElement {
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        "bg-card/95 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 w-full border-b backdrop-blur",
        className
      )}
    >
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
        >
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight">
            <span className="text-primary">Dramatis</span>
            <span className="text-secondary">HQ</span>
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden w-full max-w-sm md:flex">
            <div className="relative w-full">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search..."
                aria-label="Search"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="bg-primary absolute top-1 right-1 h-2 w-2 rounded-full" />
          </Button>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback>{initials ?? "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
