"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Pencil,
  LayoutGrid,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import type { Show } from "@/lib/db/schema/shows";
import type { Role } from "@/lib/db/schema/roles";
import { SHOW_TYPE_OPTIONS, SHOW_STATUS_OPTIONS } from "@/lib/db/schema/shows";
import type { SHOW_STATUS_VALUES } from "@/lib/db/schema/shows";

type ShowStatus = (typeof SHOW_STATUS_VALUES)[number];

interface ShowDashboardProps {
  show: Show;
  roles: Role[];
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "info"> = {
  planning: "secondary",
  auditions: "info",
  in_production: "info",
  rehearsal: "warning",
  running: "success",
  completed: "success",
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
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(show.status ?? "planning");

  const showType = SHOW_TYPE_OPTIONS.find((t) => t.value === show.type);
  const showStatus = SHOW_STATUS_OPTIONS.find((s) => s.value === currentStatus);
  const totalPositions = roles.reduce((sum, role) => sum + (role.positionCount ?? 1), 0);

  const handleStatusChange = (newStatus: ShowStatus): void => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/shows/${show.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error("Failed to update status");
        }

        setCurrentStatus(newStatus);
        const newStatusLabel =
          SHOW_STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus;
        toast({
          title: "Status updated",
          description: `Show status changed to ${newStatusLabel}`,
        });
        router.refresh();
      } catch {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{show.title}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isPending}>
                <button className="focus:ring-primary rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  <Badge
                    variant={STATUS_COLORS[currentStatus]}
                    className="flex cursor-pointer items-center gap-1 transition-opacity hover:opacity-80"
                  >
                    {showStatus?.label ?? "Planning"}
                    <ChevronDown className="h-3 w-3" />
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {SHOW_STATUS_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      handleStatusChange(option.value);
                    }}
                    className={currentStatus === option.value ? "bg-accent" : ""}
                  >
                    <Badge variant={STATUS_COLORS[option.value]} className="mr-2">
                      {option.label}
                    </Badge>
                    {currentStatus === option.value && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-muted-foreground mt-1">{showType?.label ?? "Production"}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/producer/shows/${show.id}/casting`}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Casting Board
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/producer/shows/${show.id}/schedule`}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Schedule
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/producer/shows/${show.id}?tab=settings`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Show
            </Link>
          </Button>
        </div>
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
