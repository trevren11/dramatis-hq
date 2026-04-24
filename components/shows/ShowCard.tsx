"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Calendar, Users, Copy, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Show } from "@/lib/db/schema/shows";
import { SHOW_TYPE_OPTIONS, SHOW_STATUS_OPTIONS } from "@/lib/db/schema/shows";

interface ShowCardProps {
  show: Show;
  roleCount?: number;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getNextDate(show: Show): { label: string; date: string } {
  const now = new Date();

  if (show.rehearsalStart && new Date(show.rehearsalStart) > now) {
    return { label: "Rehearsal starts", date: formatDate(show.rehearsalStart) };
  }
  if (show.performanceStart && new Date(show.performanceStart) > now) {
    return { label: "Opens", date: formatDate(show.performanceStart) };
  }
  if (show.performanceEnd && new Date(show.performanceEnd) > now) {
    return { label: "Closes", date: formatDate(show.performanceEnd) };
  }
  if (show.performanceEnd) {
    return { label: "Closed", date: formatDate(show.performanceEnd) };
  }

  return { label: "Dates", date: "TBD" };
}

export function ShowCard({
  show,
  roleCount = 0,
  onDuplicate,
  onDelete,
}: ShowCardProps): React.ReactElement {
  const showType = SHOW_TYPE_OPTIONS.find((t) => t.value === show.type);
  const showStatus = SHOW_STATUS_OPTIONS.find((s) => s.value === show.status);
  const nextDate = getNextDate(show);

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/producer/shows/${show.id}`}
              className="hover:text-primary text-lg font-semibold transition-colors"
            >
              {show.title}
            </Link>
            <p className="text-muted-foreground text-sm">{showType?.label ?? "Production"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_COLORS[show.status ?? "planning"]}>
              {showStatus?.label ?? "Planning"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/producer/shows/${show.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem
                    onClick={() => {
                      onDuplicate(show.id);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => {
                      onDelete(show.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-6 text-sm">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>
              {nextDate.label}: {nextDate.date}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{roleCount} roles</span>
          </div>
        </div>
        {show.venue && <p className="text-muted-foreground mt-2 truncate text-sm">{show.venue}</p>}
      </CardContent>
    </Card>
  );
}
