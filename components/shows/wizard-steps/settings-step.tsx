"use client";

import { Label } from "@/components/ui/label";
import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";
import type { ShowCreate } from "@/lib/validations/shows";

interface Props {
  data: Partial<ShowCreate>;
  onUpdate: (data: Partial<ShowCreate>) => void;
}

export function SettingsStep({ data, onUpdate }: Props): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Union Status</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          What is the union status for this production?
        </p>

        <div className="space-y-3">
          {UNION_STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                data.unionStatus === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="unionStatus"
                value={option.value}
                checked={data.unionStatus === option.value}
                onChange={(e) =>
                  onUpdate({ unionStatus: e.target.value as ShowCreate["unionStatus"] })
                }
                className="sr-only"
              />
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  data.unionStatus === option.value ? "border-primary" : "border-muted-foreground"
                }`}
              >
                {data.unionStatus === option.value && (
                  <div className="bg-primary h-2.5 w-2.5 rounded-full" />
                )}
              </div>
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="mb-3 text-sm font-medium">Visibility</h3>
        <label
          className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
            data.isPublic ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <div>
            <Label className="cursor-pointer">Public Production</Label>
            <p className="text-muted-foreground text-sm">
              Allow this production to appear in public searches and listings
            </p>
          </div>
          <input
            type="checkbox"
            checked={data.isPublic ?? true}
            onChange={(e) => onUpdate({ isPublic: e.target.checked })}
            className="h-5 w-5 rounded border-gray-300"
          />
        </label>
      </div>
    </div>
  );
}
