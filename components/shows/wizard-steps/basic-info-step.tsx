"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOW_TYPE_OPTIONS } from "@/lib/db/schema/shows";
import type { ShowCreate } from "@/lib/validations/shows";

interface Props {
  data: Partial<ShowCreate>;
  onUpdate: (data: Partial<ShowCreate>) => void;
}

export function BasicInfoStep({ data, onUpdate }: Props): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Production Title *</Label>
        <Input
          id="title"
          value={data.title ?? ""}
          onChange={(e) => {
            onUpdate({ title: e.target.value });
          }}
          placeholder="e.g., Hamilton, The Phantom of the Opera"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Production Type</Label>
        <select
          id="type"
          value={data.type ?? "play"}
          onChange={(e) => {
            onUpdate({ type: e.target.value as ShowCreate["type"] });
          }}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {SHOW_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={data.description ?? ""}
          onChange={(e) => {
            onUpdate({ description: e.target.value || null });
          }}
          placeholder="Brief description of the production, synopsis, or artistic vision..."
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}
