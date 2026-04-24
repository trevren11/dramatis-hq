"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, ChevronUp, ChevronDown, Users } from "lucide-react";
import type { Role } from "@/lib/db/schema/roles";
import { ROLE_TYPE_OPTIONS } from "@/lib/db/schema/roles";

interface RoleCardProps {
  role: Role;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const TYPE_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "info"> = {
  lead: "success",
  supporting: "info",
  ensemble: "secondary",
  understudy: "warning",
  swing: "default",
};

export function RoleCard({
  role,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: RoleCardProps): React.ReactElement {
  const roleType = ROLE_TYPE_OPTIONS.find((t) => t.value === role.type);

  const ageRange =
    role.ageRangeMin || role.ageRangeMax
      ? `${role.ageRangeMin ?? "?"}-${role.ageRangeMax ?? "?"}`
      : null;

  return (
    <Card className="group">
      <CardContent className="flex items-start gap-4 p-4">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={onMoveUp}
            disabled={isFirst}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={onMoveDown}
            disabled={isLast}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Role info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{role.name}</h3>
            <Badge variant={TYPE_COLORS[role.type ?? "supporting"]}>
              {roleType?.label ?? "Supporting"}
            </Badge>
            {(role.positionCount ?? 1) > 1 && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {role.positionCount}
              </Badge>
            )}
          </div>

          {role.description && (
            <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{role.description}</p>
          )}

          <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
            {ageRange && <span>Age: {ageRange}</span>}
            {role.vocalRange && <span>Vocal: {role.vocalRange}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
