"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleSlot } from "./RoleSlot";
import type { TalentCardData } from "./TalentCard";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface RoleData {
  id: string;
  name: string;
  type: "lead" | "supporting" | "ensemble" | "understudy" | "swing" | null;
  positionCount: number | null;
  description?: string | null;
}

interface AssignmentData {
  roleId: string;
  slotIndex: number;
  talent: TalentCardData;
  isLocked: boolean;
  status: "draft" | "tentative" | "confirmed" | "declined";
}

interface RoleCardProps {
  role: RoleData;
  assignments: AssignmentData[];
  onLockToggle?: (talentId: string, isLocked: boolean) => void;
  onEject?: (talentId: string) => void;
  selectedTalentId?: string | null;
  presenceMap?: Record<string, { name: string; color: string }>;
  disabled?: boolean;
}

const ROLE_TYPE_COLORS: Record<string, string> = {
  lead: "bg-purple-100 text-purple-800",
  supporting: "bg-blue-100 text-blue-800",
  ensemble: "bg-green-100 text-green-800",
  understudy: "bg-orange-100 text-orange-800",
  swing: "bg-pink-100 text-pink-800",
};

export function RoleCard({
  role,
  assignments,
  onLockToggle,
  onEject,
  selectedTalentId,
  presenceMap = {},
  disabled = false,
}: RoleCardProps): React.ReactElement {
  const positionCount = role.positionCount ?? 1;
  const slots = Array.from({ length: positionCount }, (_, i) => i);

  const assignmentsBySlot = new Map<number, AssignmentData>();
  for (const assignment of assignments) {
    assignmentsBySlot.set(assignment.slotIndex, assignment);
  }

  const filledCount = assignments.length;
  const isFilled = filledCount >= positionCount;

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        isFilled && "border-green-200 bg-green-50/30"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{role.name}</CardTitle>
          <div className="flex items-center gap-2">
            {role.type && (
              <Badge
                variant="outline"
                className={cn("text-xs capitalize", ROLE_TYPE_COLORS[role.type])}
              >
                {role.type}
              </Badge>
            )}
            <Badge variant={isFilled ? "success" : "secondary"} className="text-xs">
              <Users className="mr-1 h-3 w-3" />
              {filledCount}/{positionCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {slots.map((slotIndex) => {
          const assignment = assignmentsBySlot.get(slotIndex);
          const talent = assignment
            ? {
                ...assignment.talent,
                isLocked: assignment.isLocked,
                status: assignment.status,
              }
            : null;

          return (
            <RoleSlot
              key={slotIndex}
              roleId={role.id}
              slotIndex={slotIndex}
              talent={talent}
              onLockToggle={onLockToggle}
              onEject={onEject}
              selectedTalentId={selectedTalentId}
              presenceData={talent ? presenceMap[talent.id] : null}
              disabled={disabled}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
