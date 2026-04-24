"use client";

import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";
import type { CompanyProfile } from "@/lib/validations/company";

interface UnionStepProps {
  data: Partial<CompanyProfile>;
  onUpdate: (data: Partial<CompanyProfile>) => void;
}

export function UnionStep({ data, onUpdate }: UnionStepProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Union Status</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Let talent know whether you work with union members, non-union performers, or both.
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
                onChange={(e) => {
                  onUpdate({ unionStatus: e.target.value as CompanyProfile["unionStatus"] });
                }}
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

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="mb-2 text-sm font-medium">What does this mean?</h4>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>
            <strong>Union Only:</strong> You exclusively work with union talent (SAG-AFTRA, AEA,
            etc.)
          </li>
          <li>
            <strong>Non-Union Only:</strong> You work exclusively with non-union performers
          </li>
          <li>
            <strong>Union Signatory:</strong> You are a signatory to union contracts
          </li>
          <li>
            <strong>Both:</strong> You work with both union and non-union talent depending on the
            project
          </li>
        </ul>
      </div>
    </div>
  );
}
