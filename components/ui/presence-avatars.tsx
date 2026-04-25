"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePresence, type PresenceMember } from "@/lib/hooks/use-presence";

interface PresenceAvatarsProps {
  channelName: string;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Generate a consistent color from a user ID
function getUserColor(userId: string): string {
  const colors = [
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#14B8A6", // teal
    "#3B82F6", // blue
    "#8B5CF6", // violet
    "#EC4899", // pink
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? "#6b7280";
}

export function PresenceAvatars({
  channelName,
  maxDisplay = 5,
  size = "sm",
  showLabel = true,
  className,
}: PresenceAvatarsProps): React.ReactElement | null {
  const { members, me, isConnected } = usePresence(channelName);

  // Filter out current user from display
  const otherMembers = members.filter((m) => m.id !== me?.id);

  if (!isConnected || otherMembers.length === 0) {
    return null;
  }

  const displayMembers = otherMembers.slice(0, maxDisplay);
  const remainingCount = otherMembers.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <span className="text-muted-foreground text-xs">
            {otherMembers.length === 1
              ? "1 viewer"
              : `${otherMembers.length} viewers`}
          </span>
        )}
        <div className="flex -space-x-2">
          {displayMembers.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    "border-background border-2 ring-2 ring-white"
                  )}
                >
                  {member.info.image && (
                    <AvatarImage
                      src={member.info.image}
                      alt={member.info.name}
                    />
                  )}
                  <AvatarFallback
                    style={{ backgroundColor: getUserColor(member.id) }}
                    className="text-white"
                  >
                    {getInitials(member.info.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{member.info.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    "border-background border-2 bg-gray-500"
                  )}
                >
                  <AvatarFallback className="bg-gray-500 text-white">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {remainingCount} more{" "}
                  {remainingCount === 1 ? "viewer" : "viewers"}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Standalone component for showing presence without the hook
export function PresenceAvatarsList({
  members,
  currentUserId,
  maxDisplay = 5,
  size = "sm",
  showLabel = true,
  className,
}: {
  members: PresenceMember[];
  currentUserId?: string;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}): React.ReactElement | null {
  const otherMembers = currentUserId
    ? members.filter((m) => m.id !== currentUserId)
    : members;

  if (otherMembers.length === 0) {
    return null;
  }

  const displayMembers = otherMembers.slice(0, maxDisplay);
  const remainingCount = otherMembers.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <span className="text-muted-foreground text-xs">
            {otherMembers.length === 1
              ? "1 viewer"
              : `${otherMembers.length} viewers`}
          </span>
        )}
        <div className="flex -space-x-2">
          {displayMembers.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    "border-background border-2 ring-2 ring-white"
                  )}
                >
                  {member.info.image && (
                    <AvatarImage
                      src={member.info.image}
                      alt={member.info.name}
                    />
                  )}
                  <AvatarFallback
                    style={{ backgroundColor: getUserColor(member.id) }}
                    className="text-white"
                  >
                    {getInitials(member.info.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{member.info.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Avatar
              className={cn(
                sizeClasses[size],
                "border-background border-2 bg-gray-500"
              )}
            >
              <AvatarFallback className="bg-gray-500 text-white">
                +{remainingCount}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
