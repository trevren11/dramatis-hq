"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationList } from "./ApplicationList";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  ArrowLeft,
  Settings,
  ExternalLink,
  QrCode,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { Audition, AuditionApplication } from "@/lib/db/schema/auditions";
import type { Role } from "@/lib/db/schema/roles";
import { AUDITION_STATUS_OPTIONS, AUDITION_VISIBILITY_OPTIONS } from "@/lib/db/schema/auditions";

interface TalentSummary {
  id: string;
  firstName: string;
  lastName: string;
  stageName?: string | null;
  location?: string | null;
  ageRangeLow?: number | null;
  ageRangeHigh?: number | null;
  gender?: string | null;
  ethnicity?: string | null;
  vocalRange?: string | null;
}

interface ApplicationWithTalent {
  application: AuditionApplication;
  talent: TalentSummary;
}

interface AuditionManagementProps {
  audition: Audition;
  roles: Role[];
  initialApplications: ApplicationWithTalent[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
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

export function AuditionManagement({
  audition,
  roles,
  initialApplications,
}: AuditionManagementProps): React.ReactElement {
  const status = AUDITION_STATUS_OPTIONS.find((s) => s.value === audition.status);
  const visibility = AUDITION_VISIBILITY_OPTIONS.find((v) => v.value === audition.visibility);

  const auditionDates = audition.auditionDates as { date: string }[] | null;
  const firstDate = auditionDates?.[0]?.date;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href="/producer/auditions">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Auditions
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{audition.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_COLORS[audition.status ?? "draft"]}>
              {status?.label ?? "Draft"}
            </Badge>
            <Badge variant="outline">{visibility?.label ?? "Public"}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {audition.status === "open" && (
            <Button variant="outline" asChild>
              <Link href={`/auditions/${audition.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/producer/auditions/${audition.id}/checkin`}>
              <QrCode className="mr-2 h-4 w-4" />
              Check-in
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/producer/auditions/${audition.id}/callbacks`}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Callbacks
            </Link>
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-5 w-5" />
              <span className="text-2xl font-bold">{initialApplications.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Audition Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <span className="text-lg font-medium">
                {firstDate ? formatDate(firstDate) : "Not set"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {audition.isVirtual ? (
                <>
                  <Video className="text-muted-foreground h-5 w-5" />
                  <span className="text-lg font-medium">Virtual</span>
                </>
              ) : (
                <>
                  <MapPin className="text-muted-foreground h-5 w-5" />
                  <span className="truncate text-lg font-medium">
                    {audition.location ?? "Not set"}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles */}
      {roles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles Being Cast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role.id} variant="secondary">
                  {role.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications */}
      <ApplicationList auditionId={audition.id} initialApplications={initialApplications} />
    </div>
  );
}
