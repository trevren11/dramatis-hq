"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PresenceUser {
  id: string;
  userName: string;
  color: string | null;
  cursorPosition?: string | null;
  selectedTalentId?: string | null;
}

interface PresenceIndicatorsProps {
  users: PresenceUser[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PresenceIndicators({
  users,
  className,
}: PresenceIndicatorsProps): React.ReactElement | null {
  if (users.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-muted-foreground mr-1 text-xs">Also viewing:</span>
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <Avatar
            key={user.id}
            className="h-6 w-6 border-2 border-white"
            style={{ backgroundColor: user.color ?? "#6b7280" }}
            title={user.userName}
          >
            <AvatarFallback
              className="text-xs text-white"
              style={{ backgroundColor: user.color ?? "#6b7280" }}
            >
              {getInitials(user.userName)}
            </AvatarFallback>
          </Avatar>
        ))}
        {users.length > 5 && (
          <Avatar className="h-6 w-6 border-2 border-white bg-gray-500">
            <AvatarFallback className="text-xs text-white">+{users.length - 5}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

export function buildPresenceMap(
  users: PresenceUser[]
): Record<string, { name: string; color: string }> {
  const map: Record<string, { name: string; color: string }> = {};
  for (const user of users) {
    if (user.selectedTalentId) {
      map[user.selectedTalentId] = {
        name: user.userName,
        color: user.color ?? "#6b7280",
      };
    }
  }
  return map;
}
