"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { User, MapPin, Calendar } from "lucide-react";
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

interface ApplicationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: AuditionApplication;
  talent: TalentSummary;
  onStatusUpdate: (applicationId: string, status: string, notes?: string) => Promise<void>;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

// eslint-disable-next-line complexity
export function ApplicationReviewDialog({
  open,
  onOpenChange,
  application,
  talent,
  onStatusUpdate,
}: ApplicationReviewDialogProps): React.ReactElement {
  const [status, setStatus] = useState(application.status ?? "submitted");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = talent.stageName ?? `${talent.firstName} ${talent.lastName}`;
  const materials = application.materials ?? {};

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await onStatusUpdate(application.id, status, notes || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Review Application</ModalTitle>
          <ModalDescription>Review the application and update its status</ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          {/* Talent Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-background flex h-12 w-12 items-center justify-center rounded-full">
                <User className="text-muted-foreground h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">{displayName}</h4>
                <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
                  {talent.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {talent.location}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mt-1 flex flex-wrap gap-3 text-xs">
                  {(talent.ageRangeLow ?? talent.ageRangeHigh) && (
                    <span>
                      Age: {talent.ageRangeLow ?? "?"}-{talent.ageRangeHigh ?? "?"}
                    </span>
                  )}
                  {talent.gender && <span>{talent.gender}</span>}
                  {talent.vocalRange && <span>Vocal: {talent.vocalRange}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Info */}
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Calendar className="h-4 w-4" />
            <span>Submitted {formatDate(application.submittedAt)}</span>
          </div>

          {/* Materials */}
          {(materials.headshotId ??
            materials.resumeId ??
            materials.videoUrl ??
            materials.audioUrl) && (
            <div>
              <Label className="text-sm">Submitted Materials</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {materials.headshotId && <Badge variant="outline">Headshot</Badge>}
                {materials.resumeId && <Badge variant="outline">Resume</Badge>}
                {materials.videoUrl && (
                  <a href={materials.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                      Video
                    </Badge>
                  </a>
                )}
                {materials.audioUrl && (
                  <a href={materials.audioUrl} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                      Audio
                    </Badge>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setStatus(e.target.value as typeof status);
              }}
              options={APPLICATION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setNotes(e.target.value);
              }}
              placeholder="Add notes about this applicant..."
              rows={3}
            />
            <p className="text-muted-foreground text-xs">
              These notes are only visible to your team, not the applicant.
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
