"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TalentCard, type TalentCardData } from "./TalentCard";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, X } from "lucide-react";

interface RoleSlotProps {
  roleId: string;
  slotIndex: number;
  talent: TalentCardData | null;
  isOver?: boolean;
  onLockToggle?: (talentId: string, isLocked: boolean) => void;
  onEject?: (talentId: string) => void;
  selectedTalentId?: string | null;
  presenceData?: { name: string; color: string } | null;
  disabled?: boolean;
}

export function RoleSlot({
  roleId,
  slotIndex,
  talent,
  onLockToggle,
  onEject,
  selectedTalentId,
  presenceData,
  disabled = false,
}: RoleSlotProps): React.ReactElement {
  const { isOver, setNodeRef } = useDroppable({
    id: `role-${roleId}-slot-${String(slotIndex)}`,
    data: {
      type: "role-slot",
      roleId,
      slotIndex,
      occupied: !!talent,
    },
    disabled: disabled || !!talent,
  });

  if (talent) {
    const isSelected = selectedTalentId === talent.id;
    const talentWithLocation: TalentCardData = {
      ...talent,
      location: "role",
      roleId,
      slotIndex,
    };

    return (
      <div className="group relative">
        <TalentCard
          talent={talentWithLocation}
          compact
          showStatus
          isSelected={isSelected}
          selectedBy={presenceData}
          disabled={disabled}
        />
        {!disabled && (
          <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="secondary"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                onLockToggle?.(talent.id, !talent.isLocked);
              }}
              title={talent.isLocked ? "Unlock" : "Lock"}
            >
              {talent.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </Button>
            {!talent.isLocked && (
              <Button
                variant="destructive"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  onEject?.(talent.id);
                }}
                title="Remove"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-10 items-center justify-center rounded-md border-2 border-dashed transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-gray-200 bg-gray-50",
        disabled && "opacity-50"
      )}
    >
      <span className="text-muted-foreground text-xs">Drop talent here</span>
    </div>
  );
}
