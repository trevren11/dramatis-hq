"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, MapPin } from "lucide-react";
import type { AuditionApplication } from "@/lib/db/schema/auditions";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/db/schema/auditions";

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

interface ApplicationCardProps {
  application: AuditionApplication;
  talent: TalentSummary;
  onReview?: (applicationId: string) => void;
}

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "info"
> = {
  submitted: "info",
  reviewed: "secondary",
  callback: "warning",
  rejected: "destructive",
  cast: "success",
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ApplicationCard({
  application,
  talent,
  onReview,
}: ApplicationCardProps): React.ReactElement {
  const status = APPLICATION_STATUS_OPTIONS.find((s) => s.value === application.status);
  const displayName = talent.stageName ?? `${talent.firstName} ${talent.lastName}`;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <User className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold">{displayName}</h4>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                {talent.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {talent.location}
                  </span>
                )}
                {(talent.ageRangeLow ?? talent.ageRangeHigh) && (
                  <span>
                    Age: {talent.ageRangeLow ?? "?"}-{talent.ageRangeHigh ?? "?"}
                  </span>
                )}
                {talent.vocalRange && <span>Vocal: {talent.vocalRange}</span>}
              </div>
            </div>
          </div>
          <Badge variant={STATUS_COLORS[application.status ?? "submitted"]}>
            {status?.label ?? "Submitted"}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>Applied {formatDate(application.submittedAt)}</span>
          </div>
          {onReview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onReview(application.id);
              }}
            >
              Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
