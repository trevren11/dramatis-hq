"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Pencil } from "lucide-react";
import Link from "next/link";
import type { Show } from "@/lib/db/schema/shows";
import type { Role } from "@/lib/db/schema/roles";
import { SHOW_TYPE_OPTIONS, SHOW_STATUS_OPTIONS } from "@/lib/db/schema/shows";

interface ShowDashboardProps {
  show: Show;
  roles: Role[];
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "info"> = {
  planning: "secondary",
  auditions: "info",
  rehearsal: "warning",
  running: "success",
  closed: "default",
};

function formatDate(date: Date | null): string {
  if (!date) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ShowDashboard({ show, roles }: ShowDashboardProps): React.ReactElement {
  const showType = SHOW_TYPE_OPTIONS.find((t) => t.value === show.type);
  const showStatus = SHOW_STATUS_OPTIONS.find((s) => s.value === show.status);
  const totalPositions = roles.reduce((sum, role) => sum + (role.positionCount ?? 1), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{show.title}</h1>
            <Badge variant={STATUS_COLORS[show.status ?? "planning"]}>
              {showStatus?.label ?? "Planning"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{showType?.label ?? "Production"}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/producer/shows/${show.id}?tab=settings`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Show
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-muted-foreground text-xs">{totalPositions} total positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venue</CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-lg font-bold">{show.venue ?? "TBD"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rehearsals</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(show.rehearsalStart)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performances</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(show.performanceStart)}</div>
            {show.performanceEnd && (
              <p className="text-muted-foreground text-xs">to {formatDate(show.performanceEnd)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {show.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About this Production</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{show.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
