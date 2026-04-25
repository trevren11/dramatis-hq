"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { AUDITION_DECISION_OPTIONS } from "@/lib/db/schema/callbacks";
import { RefreshCw, Hand, UserCheck, XCircle } from "lucide-react";

type AuditionDecision = "callback" | "hold_for_role" | "cast_in_role" | "release";

interface RoleInfo {
  id: string;
  name: string;
}

interface PreviousDecision {
  id: string;
  round: number;
  decision: AuditionDecision;
  notes?: string | null;
  roleId?: string | null;
  decidedAt: Date;
}

interface DecisionDialogProps {
  auditionId: string;
  sessionId: string;
  talentId: string;
  talentName: string;
  roles: RoleInfo[];
  previousDecisions?: PreviousDecision[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DECISION_ICONS: Record<AuditionDecision, React.ComponentType<{ className?: string }>> = {
  callback: RefreshCw,
  hold_for_role: Hand,
  cast_in_role: UserCheck,
  release: XCircle,
};

const DECISION_COLORS: Record<AuditionDecision, string> = {
  callback: "border-blue-500 bg-blue-50",
  hold_for_role: "border-yellow-500 bg-yellow-50",
  cast_in_role: "border-green-500 bg-green-50",
  release: "border-red-500 bg-red-50",
};

export function DecisionDialog({
  auditionId,
  sessionId,
  talentId,
  talentName,
  roles,
  previousDecisions = [],
  open,
  onOpenChange,
  onSuccess,
}: DecisionDialogProps): React.ReactElement {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<AuditionDecision | "">("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const needsRoleSelection = decision === "hold_for_role" || decision === "cast_in_role";

  const handleSubmit = async (): Promise<void> => {
    if (!decision) return;
    if (needsRoleSelection && !selectedRoleId) {
      toast({
        title: "Role Required",
        description: "Please select a role for this decision",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentProfileId: talentId,
          decision,
          roleId: needsRoleSelection ? selectedRoleId : null,
          notes: notes || null,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save decision");
      }

      const decisionLabel =
        AUDITION_DECISION_OPTIONS.find((o) => o.value === decision)?.label ?? decision;
      toast({
        title: "Decision Saved",
        description: `${talentName} marked as ${decisionLabel}`,
      });

      onSuccess();
      onOpenChange(false);

      setDecision("");
      setSelectedRoleId("");
      setNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save decision",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Decision for {talentName}</DialogTitle>
          <DialogDescription>Select the outcome of this callback audition.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {previousDecisions.length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">Previous Decisions</p>
              <div className="space-y-2">
                {previousDecisions.map((prev) => {
                  const Icon = DECISION_ICONS[prev.decision];
                  return (
                    <div key={prev.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        Round {prev.round}
                      </Badge>
                      <Icon className="h-4 w-4" />
                      <span>
                        {AUDITION_DECISION_OPTIONS.find((o) => o.value === prev.decision)?.label}
                      </span>
                      {prev.notes && (
                        <span className="text-muted-foreground truncate">- {prev.notes}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Decision</Label>
            <RadioGroup
              value={decision}
              onValueChange={(v: string) => {
                setDecision(v as AuditionDecision);
              }}
              className="grid grid-cols-2 gap-2"
            >
              {AUDITION_DECISION_OPTIONS.map((option) => {
                const Icon = DECISION_ICONS[option.value];
                return (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                      decision === option.value ? DECISION_COLORS[option.value] : "hover:bg-accent"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <Icon className="h-6 w-6" />
                    <span className="font-medium">{option.label}</span>
                    <span className="text-muted-foreground text-center text-xs">
                      {option.description}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {needsRoleSelection && roles.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={selectedRoleId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedRoleId(e.target.value);
                }}
                options={roles.map((role) => ({ value: role.id, label: role.name }))}
                placeholder="Select a role"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setNotes(e.target.value);
              }}
              placeholder="Add any notes about this decision..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!decision || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
