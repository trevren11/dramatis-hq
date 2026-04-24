"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreVertical, Users, CheckCircle, Clock, Trash2 } from "lucide-react";

type CheckinStatus = "checked_in" | "in_room" | "completed";

interface CheckinCardProps {
  queueNumber: number;
  status: CheckinStatus;
  checkedInAt: string | Date | null;
  talent: {
    id: string;
    name: string;
    email: string;
    headshotUrl?: string | null;
  };
  onStatusChange: (status: CheckinStatus) => void;
  onDelete: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  CheckinStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  checked_in: {
    label: "Waiting",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  in_room: {
    label: "In Room",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Users,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(date: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Card showing a single talent in the check-in queue
 */
export function CheckinCard({
  queueNumber,
  status,
  checkedInAt,
  talent,
  onStatusChange,
  onDelete,
  className,
}: CheckinCardProps): React.ReactElement {
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "bg-card flex items-center gap-4 rounded-lg border p-4",
        status === "completed" && "opacity-60",
        className
      )}
    >
      {/* Queue Number */}
      <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold">
        {queueNumber}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={talent.headshotUrl ?? undefined} alt={talent.name} />
        <AvatarFallback>{getInitials(talent.name)}</AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{talent.name}</p>
        <p className="text-muted-foreground truncate text-sm">{talent.email}</p>
      </div>

      {/* Checked in time */}
      {checkedInAt && (
        <div className="text-muted-foreground hidden shrink-0 text-sm sm:block">
          {formatTime(checkedInAt)}
        </div>
      )}

      {/* Status Badge */}
      <Badge variant="outline" className={cn("shrink-0", statusConfig.color)}>
        <StatusIcon className="mr-1 h-3 w-3" />
        {statusConfig.label}
      </Badge>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "checked_in" && (
            <DropdownMenuItem
              onClick={() => {
                onStatusChange("in_room");
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Mark as In Room
            </DropdownMenuItem>
          )}
          {status === "in_room" && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  onStatusChange("completed");
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onStatusChange("checked_in");
                }}
              >
                <Clock className="mr-2 h-4 w-4" />
                Back to Waiting
              </DropdownMenuItem>
            </>
          )}
          {status === "completed" && (
            <DropdownMenuItem
              onClick={() => {
                onStatusChange("in_room");
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Mark as In Room
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
