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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

interface CreateCallbackDialogProps {
  auditionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  nextRound?: number;
}

export function CreateCallbackDialog({
  auditionId,
  open,
  onOpenChange,
  onSuccess,
  nextRound = 1,
}: CreateCallbackDialogProps): React.ReactElement {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: `Callback Round ${String(nextRound)}`,
    location: "",
    isVirtual: false,
    notes: "",
    slotDurationMinutes: 15,
  });

  const handleSubmit = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/auditions/${auditionId}/callbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          round: nextRound,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create callback session");
      }

      toast({
        title: "Success",
        description: "Callback session created",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create callback session",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>Create Callback Session</DialogTitle>
            <DialogDescription>
              Set up a new callback session for second-round auditions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, name: e.target.value });
                }}
                placeholder="e.g., Callback Round 1"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, location: e.target.value });
                }}
                placeholder="e.g., Main Stage Theater"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isVirtual">Virtual Callback</Label>
              <Switch
                id="isVirtual"
                checked={formData.isVirtual}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, isVirtual: checked });
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slotDuration">Time Slot Duration (minutes)</Label>
              <Input
                id="slotDuration"
                type="number"
                min={5}
                max={120}
                value={formData.slotDurationMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({
                    ...formData,
                    slotDurationMinutes: parseInt(e.target.value, 10) || 15,
                  });
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setFormData({ ...formData, notes: e.target.value });
                }}
                placeholder="Any additional notes for this callback session..."
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
