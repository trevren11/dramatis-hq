"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_TYPE_OPTIONS } from "@/lib/db/schema/roles";
import type { RoleCreate } from "@/lib/validations/shows";

interface RoleFormProps {
  data: Partial<RoleCreate>;
  onUpdate: (data: Partial<RoleCreate>) => void;
}

export function RoleForm({ data, onUpdate }: RoleFormProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Role Name *</Label>
        <Input
          id="name"
          value={data.name ?? ""}
          onChange={(e) => {
            onUpdate({ name: e.target.value });
          }}
          placeholder="e.g., Eliza Hamilton, Ensemble Member"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Role Type</Label>
          <select
            id="type"
            value={data.type ?? "supporting"}
            onChange={(e) => {
              onUpdate({ type: e.target.value as RoleCreate["type"] });
            }}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
          >
            {ROLE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="positionCount">Number of Positions</Label>
          <Input
            id="positionCount"
            type="number"
            min={1}
            value={data.positionCount ?? 1}
            onChange={(e) => {
              onUpdate({ positionCount: parseInt(e.target.value) || 1 });
            }}
          />
          <p className="text-muted-foreground text-xs">How many actors needed for this role</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={data.description ?? ""}
          onChange={(e) => {
            onUpdate({ description: e.target.value || null });
          }}
          placeholder="Character description, personality traits, key scenes..."
          className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="ageRangeMin">Min Age</Label>
          <Input
            id="ageRangeMin"
            type="number"
            min={0}
            max={120}
            value={data.ageRangeMin ?? ""}
            onChange={(e) => {
              onUpdate({ ageRangeMin: e.target.value ? parseInt(e.target.value) : null });
            }}
            placeholder="e.g., 25"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ageRangeMax">Max Age</Label>
          <Input
            id="ageRangeMax"
            type="number"
            min={0}
            max={120}
            value={data.ageRangeMax ?? ""}
            onChange={(e) => {
              onUpdate({ ageRangeMax: e.target.value ? parseInt(e.target.value) : null });
            }}
            placeholder="e.g., 35"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vocalRange">Vocal Range</Label>
          <Input
            id="vocalRange"
            value={data.vocalRange ?? ""}
            onChange={(e) => {
              onUpdate({ vocalRange: e.target.value || null });
            }}
            placeholder="e.g., Alto, Tenor"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Casting Notes</Label>
        <textarea
          id="notes"
          value={data.notes ?? ""}
          onChange={(e) => {
            onUpdate({ notes: e.target.value || null });
          }}
          placeholder="Additional casting requirements, special skills needed..."
          className="border-input bg-background flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
