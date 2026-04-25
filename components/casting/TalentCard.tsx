"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GripVertical, Lock } from "lucide-react";

export interface TalentCardData {
  id: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  primaryHeadshotUrl: string | null;
  isLocked?: boolean;
  status?: "draft" | "tentative" | "confirmed" | "declined";
  location?: "pool" | "deck" | "role";
  roleId?: string;
  slotIndex?: number;
}

interface TalentCardProps {
  talent: TalentCardData;
  compact?: boolean;
  showStatus?: boolean;
  isSelected?: boolean;
  selectedBy?: { name: string; color: string } | null;
  onSelect?: () => void;
  disabled?: boolean;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  draft: "secondary",
  tentative: "warning",
  confirmed: "success",
  declined: "destructive",
};

function buildCardStyle(
  transform: ReturnType<typeof useDraggable>["transform"],
  isDragging: boolean,
  selectedBy: { color: string } | null
): React.CSSProperties {
  const baseStyle = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : {};
  const selectionStyle = selectedBy
    ? { borderColor: selectedBy.color, boxShadow: `0 0 0 2px ${selectedBy.color}` }
    : {};
  return { ...baseStyle, ...selectionStyle };
}

function CompactTalentCard({
  talent,
  isSelected,
  selectedBy,
  onSelect,
  disabled,
  setNodeRef,
  attributes,
  listeners,
  transform,
  isDragging,
}: {
  talent: TalentCardData;
  isSelected: boolean;
  selectedBy: { name: string; color: string } | null;
  onSelect?: () => void;
  disabled: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: ReturnType<typeof useDraggable>["attributes"];
  listeners: ReturnType<typeof useDraggable>["listeners"];
  transform: ReturnType<typeof useDraggable>["transform"];
  isDragging: boolean;
}): React.ReactElement {
  const displayName = talent.stageName ?? `${talent.firstName} ${talent.lastName}`;
  const style = buildCardStyle(transform, isDragging, selectedBy);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === "Enter" || e.key === " ") && onSelect) {
      e.preventDefault();
      onSelect();
    }
  };

  // Merge accessibility attributes - spread attributes first so our values override
  const a11yProps = {
    ...attributes,
    role: onSelect ? ("button" as const) : attributes.role,
    tabIndex: onSelect && !disabled && !talent.isLocked ? 0 : attributes.tabIndex,
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-white p-1.5 shadow-sm transition-all",
        isDragging && "opacity-50 shadow-lg",
        isSelected && "ring-2 ring-offset-1",
        selectedBy && "ring-2",
        talent.isLocked && "opacity-75",
        !disabled && !talent.isLocked && "cursor-grab active:cursor-grabbing"
      )}
      style={style}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      {...a11yProps}
      {...listeners}
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src={talent.primaryHeadshotUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="text-xs">
          {getInitials(talent.firstName, talent.lastName)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-xs font-medium">{displayName}</span>
      {talent.isLocked && <Lock className="h-3 w-3 text-amber-500" />}
    </div>
  );
}

// eslint-disable-next-line complexity -- accessibility handlers add necessary complexity
function FullTalentCard({
  talent,
  showStatus,
  isSelected,
  selectedBy,
  onSelect,
  disabled,
  setNodeRef,
  attributes,
  listeners,
  transform,
  isDragging,
}: {
  talent: TalentCardData;
  showStatus: boolean;
  isSelected: boolean;
  selectedBy: { name: string; color: string } | null;
  onSelect?: () => void;
  disabled: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: ReturnType<typeof useDraggable>["attributes"];
  listeners: ReturnType<typeof useDraggable>["listeners"];
  transform: ReturnType<typeof useDraggable>["transform"];
  isDragging: boolean;
}): React.ReactElement {
  const displayName = talent.stageName ?? `${talent.firstName} ${talent.lastName}`;
  const style = buildCardStyle(transform, isDragging, selectedBy);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === "Enter" || e.key === " ") && onSelect) {
      e.preventDefault();
      onSelect();
    }
  };

  // Merge accessibility attributes - spread attributes first so our values override
  const a11yProps = {
    ...attributes,
    role: onSelect ? ("button" as const) : attributes.role,
    tabIndex: onSelect && !disabled && !talent.isLocked ? 0 : attributes.tabIndex,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-all",
        isDragging && "opacity-50 shadow-lg",
        isSelected && "ring-primary ring-2 ring-offset-1",
        talent.isLocked && "opacity-75",
        !disabled && !talent.isLocked && "cursor-grab active:cursor-grabbing"
      )}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      {...a11yProps}
      {...listeners}
    >
      {!disabled && !talent.isLocked && (
        <GripVertical className="h-4 w-4 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={talent.primaryHeadshotUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{getInitials(talent.firstName, talent.lastName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{displayName}</p>
        {talent.stageName && (
          <p className="text-muted-foreground truncate text-xs">
            {talent.firstName} {talent.lastName}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showStatus && talent.status && (
          <Badge variant={STATUS_COLORS[talent.status]} className="text-xs capitalize">
            {talent.status}
          </Badge>
        )}
        {talent.isLocked && <Lock className="h-4 w-4 text-amber-500" />}
      </div>
    </div>
  );
}

export function TalentCard({
  talent,
  compact = false,
  showStatus = false,
  isSelected = false,
  selectedBy = null,
  onSelect,
  disabled = false,
}: TalentCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `talent-${talent.id}`,
    data: {
      type: "talent",
      talent,
      location: talent.location,
      roleId: talent.roleId,
      slotIndex: talent.slotIndex,
    },
    disabled: disabled || Boolean(talent.isLocked),
  });

  const commonProps = {
    talent,
    isSelected,
    selectedBy,
    onSelect,
    disabled,
    setNodeRef,
    attributes,
    listeners,
    transform,
    isDragging,
  };

  if (compact) {
    return <CompactTalentCard {...commonProps} />;
  }

  return <FullTalentCard {...commonProps} showStatus={showStatus} />;
}

export function TalentCardSkeleton({ compact = false }: { compact?: boolean }): React.ReactElement {
  if (compact) {
    return (
      <div className="flex animate-pulse items-center gap-2 rounded-md border bg-gray-100 p-1.5">
        <div className="h-6 w-6 rounded-full bg-gray-200" />
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="flex animate-pulse items-center gap-3 rounded-lg border bg-gray-100 p-3">
      <div className="h-10 w-10 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>
    </div>
  );
}
