"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AUDITION_VISIBILITY_OPTIONS, AUDITION_STATUS_OPTIONS } from "@/lib/db/schema/auditions";
import type { AuditionCreate } from "@/lib/validations/auditions";

interface SettingsStepProps {
  data: Partial<AuditionCreate>;
  onUpdate: (data: Partial<AuditionCreate>) => void;
}

export function SettingsStep({ data, onUpdate }: SettingsStepProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <Select
          id="visibility"
          value={data.visibility ?? "public"}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onUpdate({ visibility: e.target.value as "public" | "private" | "unlisted" });
          }}
          options={AUDITION_VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <p className="text-muted-foreground text-sm">
          {data.visibility === "public" && "Anyone can find and view this audition"}
          {data.visibility === "private" && "Only people with a direct link can view"}
          {data.visibility === "unlisted" && "Hidden from browse, but accessible via link"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={data.status ?? "draft"}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onUpdate({ status: e.target.value as "draft" | "open" | "closed" | "cancelled" });
          }}
          options={AUDITION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <p className="text-muted-foreground text-sm">
          {data.status === "draft" && "Not visible to the public yet"}
          {data.status === "open" && "Actively accepting applications"}
          {data.status === "closed" && "No longer accepting applications"}
          {data.status === "cancelled" && "Audition has been cancelled"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publishAt">Schedule Publication</Label>
        <Input
          id="publishAt"
          type="datetime-local"
          value={data.publishAt ? new Date(data.publishAt).toISOString().slice(0, 16) : ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onUpdate({
              publishAt: e.target.value ? new Date(e.target.value) : null,
            });
          }}
        />
        <p className="text-muted-foreground text-sm">
          Leave empty to publish immediately when status is set to &quot;Open&quot;
        </p>
      </div>
    </div>
  );
}
