"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationReviewDialog } from "./ApplicationReviewDialog";
import { useToast } from "@/components/ui/use-toast";
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

interface ApplicationWithTalent {
  application: AuditionApplication;
  talent: TalentSummary;
}

interface ApplicationListProps {
  auditionId: string;
  initialApplications: ApplicationWithTalent[];
}

const STATUS_TABS = [{ value: "all", label: "All" }, ...APPLICATION_STATUS_OPTIONS];

export function ApplicationList({
  auditionId,
  initialApplications,
}: ApplicationListProps): React.ReactElement {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithTalent[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithTalent | null>(
    null
  );
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const fetchApplications = useCallback(
    async (status: string): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);

        const response = await fetch(
          `/api/auditions/${auditionId}/applications?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch applications");

        const data = (await response.json()) as { applications: ApplicationWithTalent[] };
        setApplications(data.applications);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch applications",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [auditionId, toast]
  );

  const handleStatusChange = useCallback(
    (status: string): void => {
      setStatusFilter(status);
      void fetchApplications(status);
    },
    [fetchApplications]
  );

  const handleReview = useCallback(
    (applicationId: string): void => {
      const app = applications.find((a) => a.application.id === applicationId);
      if (app) {
        setSelectedApplication(app);
        setIsReviewDialogOpen(true);
      }
    },
    [applications]
  );

  const handleStatusUpdate = useCallback(
    async (applicationId: string, status: string, notes?: string): Promise<void> => {
      try {
        const response = await fetch(`/api/auditions/${auditionId}/applications/${applicationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes }),
        });

        if (!response.ok) throw new Error("Failed to update application");

        toast({
          title: "Application updated",
          description: "The application status has been updated",
        });

        // Update local state
        setApplications((prev) =>
          prev.map((a) =>
            a.application.id === applicationId
              ? {
                  ...a,
                  application: {
                    ...a.application,
                    status: status as AuditionApplication["status"],
                    notes: notes ?? null,
                  },
                }
              : a
          )
        );

        setIsReviewDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to update application",
          variant: "destructive",
        });
      }
    },
    [auditionId, toast]
  );

  const filteredApplications =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.application.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Applications</h2>
        <p className="text-muted-foreground text-sm">
          {applications.length} total application{applications.length === 1 ? "" : "s"}
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
              handleStatusChange(tab.value);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Application list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-8 text-center">
          <h3 className="font-semibold">No applications</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {statusFilter === "all"
              ? "No one has applied yet"
              : `No applications with status "${APPLICATION_STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? ""}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map(({ application, talent }) => (
            <ApplicationCard
              key={application.id}
              application={application}
              talent={talent}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {selectedApplication && (
        <ApplicationReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          application={selectedApplication.application}
          talent={selectedApplication.talent}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
