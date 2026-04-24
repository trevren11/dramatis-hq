"use client";

import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AuditionCreate } from "@/lib/validations/auditions";

interface BasicInfoStepProps {
  data: Partial<AuditionCreate>;
  shows: { id: string; title: string }[];
  onUpdate: (data: Partial<AuditionCreate>) => void;
}

export function BasicInfoStep({ data, shows, onUpdate }: BasicInfoStepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="showId">Production *</Label>
        <Select
          id="showId"
          value={data.showId ?? ""}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onUpdate({ showId: e.target.value });
          }}
          options={shows.map((show) => ({ value: show.id, label: show.title }))}
          placeholder="Select a production"
        />
        <p className="text-muted-foreground text-sm">Select the production this audition is for</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Audition Title *</Label>
        <Input
          id="title"
          value={data.title ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onUpdate({ title: e.target.value });
          }}
          placeholder="e.g., Spring Musical Auditions"
        />
        <p className="text-muted-foreground text-sm">
          A descriptive title for your audition announcement
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description ?? ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onUpdate({ description: e.target.value });
          }}
          placeholder="Describe what talent should expect, prepare, or bring to the audition..."
          rows={6}
        />
        <p className="text-muted-foreground text-sm">
          Provide details about the audition process and any special instructions
        </p>
      </div>
    </div>
  );
}
