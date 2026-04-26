"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  userName?: string | null;
  userRole?: string | null;
}

export function UserMenu({ userName, userRole }: UserMenuProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  const handleLogout = (): void => {
    startTransition(async () => {
      await logout();
    });
  };

  const profileLink = userRole === "producer" ? "/producer/shows" : "/talent/profile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="max-w-32 truncate">{userName ?? "Account"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={profileLink} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
