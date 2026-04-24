"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";
import type { CompanyProfile } from "@/lib/validations/company";

interface Props {
  data: Partial<CompanyProfile>;
  onUpdate: (data: Partial<CompanyProfile>) => void;
}

export function DetailsStep({ data, onUpdate }: Props): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={data.location ?? ""}
          onChange={(e) => onUpdate({ location: e.target.value })}
          placeholder="New York, NY"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={data.website ?? ""}
          onChange={(e) => onUpdate({ website: e.target.value })}
          placeholder="https://www.yourcompany.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unionStatus">Union Status</Label>
        <select
          id="unionStatus"
          value={data.unionStatus ?? ""}
          onChange={(e) => onUpdate({ unionStatus: e.target.value as CompanyProfile["unionStatus"] })}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select union status...</option>
          {UNION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="isPublic">Visibility</Label>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={data.isPublic ?? true}
            onChange={(e) => onUpdate({ isPublic: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="isPublic" className="text-sm">
            Make company page publicly visible
          </label>
        </div>
        <p className="text-muted-foreground text-xs">
          When enabled, your company page will be visible at your public URL
        </p>
      </div>
    </div>
  );
}
