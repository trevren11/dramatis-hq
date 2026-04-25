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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Users, FileCheck, Download } from "lucide-react";

interface ImportCallbacksDialogProps {
  auditionId: string;
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportCallbacksDialog({
  auditionId,
  sessionId,
  open,
  onOpenChange,
  onSuccess,
}: ImportCallbacksDialogProps): React.ReactElement {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [source, setSource] = useState<"applications" | "checkins">("applications");

  const handleImport = async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });

      const data = (await res.json()) as {
        imported?: number;
        skipped?: number;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to import talent");
      }

      const importedStr = String(data.imported ?? 0);
      const skippedStr = data.skipped ? `, ${String(data.skipped)} already invited` : "";
      toast({
        title: "Import Complete",
        description: `Imported ${importedStr} talent${skippedStr}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import talent",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import from Audition
          </DialogTitle>
          <DialogDescription>
            Import talent from the initial audition to this callback session.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="mb-3 block">Import Source</Label>
          <RadioGroup
            value={source}
            onValueChange={(v) => {
              setSource(v as typeof source);
            }}
            className="grid gap-3"
          >
            <Label
              htmlFor="applications"
              className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-4"
            >
              <RadioGroupItem value="applications" id="applications" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <FileCheck className="h-4 w-4" />
                  Marked for Callback
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Import talent whose applications were marked with &quot;Callback&quot; status.
                </p>
              </div>
            </Label>

            <Label
              htmlFor="checkins"
              className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-4"
            >
              <RadioGroupItem value="checkins" id="checkins" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4" />
                  All Check-ins
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Import all talent who checked in at the initial audition.
                </p>
              </div>
            </Label>
          </RadioGroup>
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
              void handleImport();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Importing..." : "Import Talent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
