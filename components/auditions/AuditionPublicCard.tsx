"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Video, Building2 } from "lucide-react";
import Link from "next/link";
import type { Audition } from "@/lib/db/schema/auditions";

interface AuditionPublicCardProps {
  audition: Audition;
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
    location?: string | null;
  };
}

function formatDate(date: Date | string | null): string {
  if (!date) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function AuditionPublicCard({
  audition,
  show,
  organization,
}: AuditionPublicCardProps): React.ReactElement {
  const auditionDates = audition.auditionDates as { date: string }[] | null;
  const firstDate = auditionDates?.[0]?.date;

  return (
    <Link href={`/auditions/${audition.slug}`}>
      <Card className="hover:border-primary/50 h-full cursor-pointer transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="hover:text-primary line-clamp-1 text-lg font-semibold transition-colors">
                {audition.title}
              </h3>
              <p className="text-muted-foreground text-sm">{show.title}</p>
            </div>
            {audition.isVirtual && (
              <Badge variant="secondary" className="shrink-0">
                <Video className="mr-1 h-3 w-3" />
                Virtual
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Organization */}
          <div className="flex items-center gap-2">
            {organization.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={organization.logoUrl}
                alt={organization.companyName}
                className="h-6 w-6 rounded object-cover"
              />
            ) : (
              <div className="bg-muted flex h-6 w-6 items-center justify-center rounded">
                <Building2 className="text-muted-foreground h-3 w-3" />
              </div>
            )}
            <span className="text-sm font-medium">{organization.companyName}</span>
          </div>

          {/* Info */}
          <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {firstDate
                  ? formatDate(firstDate)
                  : audition.submissionDeadline
                    ? `Deadline: ${formatDate(audition.submissionDeadline)}`
                    : "Dates TBD"}
              </span>
            </div>
            {!audition.isVirtual && (audition.location ?? organization.location) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="max-w-40 truncate">
                  {audition.location ?? organization.location}
                </span>
              </div>
            )}
          </div>

          {/* Description preview */}
          {audition.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{audition.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
