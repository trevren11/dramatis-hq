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
import { MoreHorizontal, Calendar, Users, MapPin, Video, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import type { Audition } from "@/lib/db/schema/auditions";
import { AUDITION_STATUS_OPTIONS } from "@/lib/db/schema/auditions";

interface AuditionCardProps {
  audition: Audition & { applicationCount?: number };
  onDelete?: (id: string) => void;
}

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  draft: "secondary",
  open: "success",
  closed: "default",
  cancelled: "destructive",
};

function formatDate(date: Date | null): string {
  if (!date) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function AuditionCard({ audition, onDelete }: AuditionCardProps): React.ReactElement {
  const auditionStatus = AUDITION_STATUS_OPTIONS.find((s) => s.value === audition.status);
  const applicationCount = audition.applicationCount ?? 0;

  // Get first audition date if available
  const auditionDates = audition.auditionDates as { date: string }[] | null;
  const firstDate = auditionDates?.[0]?.date;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/producer/auditions/${audition.id}`}
              className="hover:text-primary text-lg font-semibold transition-colors"
            >
              {audition.title}
            </Link>
            <p className="text-muted-foreground truncate text-sm">
              {audition.isVirtual ? "Virtual Audition" : (audition.location ?? "Location TBD")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_COLORS[audition.status ?? "draft"]}>
              {auditionStatus?.label ?? "Draft"}
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
                  <Link href={`/producer/auditions/${audition.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {audition.status === "open" && (
                  <DropdownMenuItem asChild>
                    <Link href={`/auditions/${audition.slug}`} target="_blank">
                      <Eye className="mr-2 h-4 w-4" />
                      View Public Page
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => {
                      onDelete(audition.id);
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
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>
              {firstDate
                ? formatDate(new Date(firstDate))
                : audition.submissionDeadline
                  ? `Deadline: ${formatDate(audition.submissionDeadline)}`
                  : "Dates TBD"}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{applicationCount} applications</span>
          </div>
          {audition.isVirtual ? (
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              <span>Virtual</span>
            </div>
          ) : audition.location ? (
            <div className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="max-w-32 truncate">{audition.location}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
