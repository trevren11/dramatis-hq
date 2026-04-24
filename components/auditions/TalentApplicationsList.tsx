"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "./ApplicationStatus";
import { Calendar, MapPin, Video, Building2 } from "lucide-react";
import Link from "next/link";
import type { AuditionApplication } from "@/lib/db/schema/auditions";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/db/schema/auditions";

interface ApplicationWithDetails {
  application: AuditionApplication;
  audition: {
    id: string;
    title: string;
    slug: string;
    location?: string | null;
    isVirtual?: boolean | null;
    auditionDates: unknown;
    submissionDeadline?: Date | null;
    status: string | null;
  };
  show: {
    id: string;
    title: string;
    type?: string | null;
    venue?: string | null;
  };
  organization: {
    id: string;
    companyName: string;
    slug: string;
    logoUrl?: string | null;
  };
}

interface TalentApplicationsListProps {
  initialApplications: ApplicationWithDetails[];
}

const STATUS_TABS = [{ value: "all", label: "All" }, ...APPLICATION_STATUS_OPTIONS];

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function TalentApplicationsList({
  initialApplications,
}: TalentApplicationsListProps): React.ReactElement {
  const [applications] = useState<ApplicationWithDetails[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApplications =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.application.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track your audition applications and their status
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(tab.value);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Applications */}
      {filteredApplications.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No applications</h3>
          <p className="text-muted-foreground mt-1">
            {statusFilter === "all"
              ? "You haven't applied to any auditions yet"
              : `No applications with status "${APPLICATION_STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? ""}"`}
          </p>
          {statusFilter === "all" && (
            <Button asChild className="mt-4">
              <Link href="/auditions">Browse Auditions</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map(({ application, audition, show, organization }) => {
            const auditionDates = audition.auditionDates as { date: string }[] | null;
            const firstDate = auditionDates?.[0]?.date;

            return (
              <Card key={application.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/auditions/${audition.slug}`}
                        className="hover:text-primary text-lg font-semibold transition-colors"
                      >
                        {audition.title}
                      </Link>
                      <p className="text-muted-foreground text-sm">{show.title}</p>

                      {/* Organization */}
                      <div className="mt-2 flex items-center gap-2">
                        {organization.logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={organization.logoUrl}
                            alt={organization.companyName}
                            className="h-5 w-5 rounded object-cover"
                          />
                        ) : (
                          <Building2 className="text-muted-foreground h-4 w-4" />
                        )}
                        <span className="text-sm">{organization.companyName}</span>
                      </div>

                      {/* Info */}
                      <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Applied {formatDate(application.submittedAt)}</span>
                        </div>
                        {audition.isVirtual ? (
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            <span>Virtual</span>
                          </div>
                        ) : audition.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="max-w-32 truncate">{audition.location}</span>
                          </div>
                        ) : null}
                        {firstDate && <span>Audition: {formatDate(firstDate)}</span>}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <ApplicationStatus status={application.status ?? "submitted"} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
