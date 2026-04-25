"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Users, Plus, Settings, Play, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface CallbackSession {
  id: string;
  name: string;
  round: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduleDates: { date: string; slots: unknown[] }[];
  invitationCount: number;
  checkedInCount: number;
  createdAt: Date;
}

interface CallbackSessionListProps {
  auditionId: string;
  sessions: CallbackSession[];
  onCreateNew: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  CallbackSession["status"],
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Calendar,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Play,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function CallbackSessionList({
  auditionId,
  sessions,
  onCreateNew,
  className,
}: CallbackSessionListProps): React.ReactElement {
  if (sessions.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
          <h3 className="mb-2 text-lg font-medium">No Callbacks Scheduled</h3>
          <p className="text-muted-foreground mb-4 text-center text-sm">
            Create a callback session to invite talent for second-round reviews.
          </p>
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Callback Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Callback Sessions</h2>
        <Button onClick={onCreateNew} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => {
          const statusConfig = STATUS_CONFIG[session.status];
          const StatusIcon = statusConfig.icon;
          const dates = session.scheduleDates;

          return (
            <Card key={session.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{session.name}</CardTitle>
                    <CardDescription>Round {session.round}</CardDescription>
                  </div>
                  <Badge variant="outline" className={cn(statusConfig.color)}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dates.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span>
                      {dates.length === 1
                        ? formatDate(dates[0]?.date ?? "")
                        : `${formatDate(dates[0]?.date ?? "")} - ${formatDate(dates[dates.length - 1]?.date ?? "")}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Users className="text-muted-foreground h-4 w-4" />
                  <span>
                    {session.invitationCount} invited
                    {session.checkedInCount > 0 &&
                      ` (${String(session.checkedInCount)} checked in)`}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/producer/auditions/${auditionId}/callbacks/${session.id}`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage
                    </Link>
                  </Button>
                  {(session.status === "scheduled" || session.status === "in_progress") && (
                    <Button size="sm" asChild className="flex-1">
                      <Link
                        href={`/producer/auditions/${auditionId}/callbacks/${session.id}/checkin`}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {session.status === "in_progress" ? "Continue" : "Start"}
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
