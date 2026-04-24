"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { AuditionCreate } from "@/lib/validations/auditions";
import type { Role } from "@/lib/db/schema/roles";
import { ROLE_TYPE_OPTIONS } from "@/lib/db/schema/roles";

interface RolesStepProps {
  data: Partial<AuditionCreate>;
  roles: Role[];
  onUpdate: (data: Partial<AuditionCreate>) => void;
}

export function RolesStep({ data, roles, onUpdate }: RolesStepProps): React.ReactElement {
  const selectedRoleIds = data.roleIds ?? [];

  const toggleRole = (roleId: string): void => {
    const isSelected = selectedRoleIds.includes(roleId);
    if (isSelected) {
      onUpdate({ roleIds: selectedRoleIds.filter((id) => id !== roleId) });
    } else {
      onUpdate({ roleIds: [...selectedRoleIds, roleId] });
    }
  };

  const selectAll = (): void => {
    onUpdate({ roleIds: roles.map((r) => r.id) });
  };

  const deselectAll = (): void => {
    onUpdate({ roleIds: [] });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Roles to Cast</Label>
        <p className="text-muted-foreground text-sm">
          Choose which roles from the production are being cast in this audition
        </p>
      </div>

      {roles.length === 0 ? (
        <div className="border-border rounded-lg border border-dashed p-6 text-center">
          <p className="text-muted-foreground text-sm">
            No roles defined for this production yet. You can still create the audition and add
            roles later.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-primary text-sm hover:underline"
            >
              Select All
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-primary text-sm hover:underline"
            >
              Deselect All
            </button>
          </div>

          <div className="border-border divide-border divide-y rounded-lg border">
            {roles.map((role) => {
              const roleType = ROLE_TYPE_OPTIONS.find((t) => t.value === role.type);
              const isSelected = selectedRoleIds.includes(role.id);

              return (
                <label
                  key={role.id}
                  className={`hover:bg-muted/50 flex cursor-pointer items-start gap-3 p-4 transition-colors ${
                    isSelected ? "bg-muted/30" : ""
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      toggleRole(role.id);
                    }}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({roleType?.label ?? "Supporting"})
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {role.description}
                      </p>
                    )}
                    <div className="text-muted-foreground mt-1 flex flex-wrap gap-3 text-xs">
                      {(role.ageRangeMin ?? role.ageRangeMax) && (
                        <span>
                          Age: {role.ageRangeMin ?? "?"}-{role.ageRangeMax ?? "?"}
                        </span>
                      )}
                      {role.vocalRange && <span>Vocal: {role.vocalRange}</span>}
                      {role.positionCount && role.positionCount > 1 && (
                        <span>{role.positionCount} positions</span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <p className="text-muted-foreground text-sm">
            {selectedRoleIds.length} of {roles.length} roles selected
          </p>
        </>
      )}
    </div>
  );
}
