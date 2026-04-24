"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar, Plus, Trash2 } from "lucide-react";
import type { AuditionCreate, AuditionDateInput } from "@/lib/validations/auditions";

interface DatesLocationStepProps {
  data: Partial<AuditionCreate>;
  onUpdate: (data: Partial<AuditionCreate>) => void;
}

export function DatesLocationStep({ data, onUpdate }: DatesLocationStepProps): React.ReactElement {
  const auditionDates = data.auditionDates ?? [];

  const addDate = (): void => {
    const newDate: AuditionDateInput = {
      date: "",
      startTime: "",
    };
    onUpdate({ auditionDates: [...auditionDates, newDate] });
  };

  const updateDate = (index: number, updates: Partial<AuditionDateInput>): void => {
    const updated = auditionDates.map((d, i) => (i === index ? { ...d, ...updates } : d));
    onUpdate({ auditionDates: updated });
  };

  const removeDate = (index: number): void => {
    onUpdate({ auditionDates: auditionDates.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Virtual Audition</Label>
            <p className="text-muted-foreground text-sm">
              Enable for online auditions via video call or self-tape
            </p>
          </div>
          <Switch
            checked={data.isVirtual ?? false}
            onCheckedChange={(checked: boolean) => {
              onUpdate({ isVirtual: checked });
            }}
          />
        </div>

        {!data.isVirtual && (
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={data.location ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onUpdate({ location: e.target.value });
              }}
              placeholder="e.g., Community Theater, 123 Main St, City, State"
            />
          </div>
        )}
      </div>

      {/* Submission Deadline */}
      <div className="space-y-2">
        <Label htmlFor="deadline">Submission Deadline</Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={
            data.submissionDeadline
              ? new Date(data.submissionDeadline).toISOString().slice(0, 16)
              : ""
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onUpdate({
              submissionDeadline: e.target.value ? new Date(e.target.value) : null,
            });
          }}
        />
        <p className="text-muted-foreground text-sm">Last date to submit applications (optional)</p>
      </div>

      {/* Audition Dates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Audition Dates</Label>
            <p className="text-muted-foreground text-sm">
              Add the dates and times when auditions will be held
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addDate}>
            <Plus className="mr-1 h-4 w-4" />
            Add Date
          </Button>
        </div>

        {auditionDates.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed p-6 text-center">
            <Calendar className="text-muted-foreground mx-auto h-8 w-8" />
            <p className="text-muted-foreground mt-2 text-sm">No audition dates added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditionDates.map((date, index) => (
              <div
                key={index}
                className="border-border flex flex-wrap items-end gap-3 rounded-lg border p-3"
              >
                <div className="min-w-40 flex-1 space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={date.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateDate(index, { date: e.target.value });
                    }}
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={date.startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateDate(index, { startTime: e.target.value });
                    }}
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={date.endTime ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateDate(index, { endTime: e.target.value || undefined });
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    removeDate(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
