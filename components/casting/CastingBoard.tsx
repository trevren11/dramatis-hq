/* eslint-disable max-lines */
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoleCard } from "./RoleCard";
import { TierGroup } from "./TierGroup";
import { TalentPool } from "./TalentPool";
import { DeckArea } from "./DeckArea";
import { TalentCard, type TalentCardData } from "./TalentCard";
import { PresenceIndicators, buildPresenceMap } from "./PresenceIndicators";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { RefreshCw, Lock, Unlock, Mail, FileText } from "lucide-react";
import { SendNotificationFlow, CastListGenerator } from "@/components/notifications";
import type { EmailTemplate } from "@/lib/db/schema/notifications";

interface RoleData {
  id: string;
  name: string;
  type: "lead" | "supporting" | "ensemble" | "understudy" | "swing" | null;
  positionCount: number | null;
  description?: string | null;
  sortOrder: number | null;
}

interface AssignmentData {
  id: string;
  showId: string;
  roleId: string;
  talentProfileId: string;
  slotIndex: number;
  status: "draft" | "tentative" | "confirmed" | "declined";
  isLocked: boolean;
  talent: TalentCardData;
}

interface DeckItemData {
  id: string;
  showId: string;
  talentProfileId: string;
  sortOrder: number;
  notes: string | null;
  talent: TalentCardData;
}

interface PresenceUser {
  id: string;
  userName: string;
  color: string | null;
  cursorPosition: string | null;
  selectedTalentId: string | null;
}

interface CastingBoardProps {
  showId: string;
  showTitle: string;
  organizationName?: string;
  initialRoles: RoleData[];
  initialAssignments: AssignmentData[];
  initialDeck: DeckItemData[];
  initialPool: TalentCardData[];
  initialTemplates?: EmailTemplate[];
}

interface CastingResponse {
  assignments: AssignmentData[];
  deck: DeckItemData[];
  pool: TalentCardData[];
}

interface MoveResponse {
  type: string;
  assignment?: AssignmentData;
  deckItem?: DeckItemData;
}

interface PresenceResponse {
  presence: PresenceUser[];
}

interface MoveParams {
  talent: TalentCardData;
  sourceType: "pool" | "role" | "deck";
  destType: "pool" | "role" | "deck";
  activeRoleId?: string;
  activeSlotIndex?: number;
  overRoleId?: string;
  overSlotIndex?: number;
}

type TierType = "Leads" | "Supporting" | "Ensemble" | "Other";

function getTier(type: string | null): TierType {
  if (type === "lead") return "Leads";
  if (type === "supporting") return "Supporting";
  if (type === "ensemble") return "Ensemble";
  return "Other";
}

function groupRolesByTier(roles: RoleData[]): Record<TierType, RoleData[]> {
  const result: Record<TierType, RoleData[]> = {
    Leads: [],
    Supporting: [],
    Ensemble: [],
    Other: [],
  };
  for (const role of roles) {
    result[getTier(role.type)].push(role);
  }
  return result;
}

function groupAssignmentsByRole(assignments: AssignmentData[]): Record<string, AssignmentData[]> {
  return assignments.reduce<Record<string, AssignmentData[]>>((acc, assignment) => {
    const existing = acc[assignment.roleId] ?? [];
    acc[assignment.roleId] = [...existing, assignment];
    return acc;
  }, {});
}

export function CastingBoard({
  showId,
  showTitle,
  organizationName = "",
  initialRoles,
  initialAssignments,
  initialDeck,
  initialPool,
  initialTemplates = [],
}: CastingBoardProps): React.ReactElement {
  const { toast } = useToast();
  const [roles] = useState(initialRoles);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [deck, setDeck] = useState(initialDeck);
  const [pool, setPool] = useState(initialPool);
  const [templates] = useState(initialTemplates);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const [isDeckExpanded, setIsDeckExpanded] = useState(true);
  const [activeDragTalent, setActiveDragTalent] = useState<TalentCardData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNotificationFlow, setShowNotificationFlow] = useState(false);
  const [showCastList, setShowCastList] = useState(false);

  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const updatePresence = useCallback(async () => {
    try {
      const response = await fetch(`/api/shows/${showId}/casting/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTalentId }),
      });
      if (response.ok) {
        const data = (await response.json()) as PresenceResponse;
        setPresence(data.presence);
      }
    } catch {
      /* Silently fail presence updates */
    }
  }, [showId, selectedTalentId]);

  useEffect(() => {
    void updatePresence();
    presenceIntervalRef.current = setInterval(() => void updatePresence(), 5000);
    return () => {
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
      void fetch(`/api/shows/${showId}/casting/presence`, { method: "DELETE" });
    };
  }, [updatePresence, showId]);

  const performMove = useCallback(
    async (params: MoveParams): Promise<void> => {
      try {
        const response = await fetch(`/api/shows/${showId}/casting/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            talentProfileId: params.talent.id,
            source: {
              type: params.sourceType,
              roleId: params.activeRoleId,
              slotIndex: params.activeSlotIndex,
            },
            destination: {
              type: params.destType,
              roleId: params.overRoleId,
              slotIndex: params.overSlotIndex ?? 0,
            },
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          toast({
            title: "Move failed",
            description: data.error ?? "Could not move talent",
            variant: "destructive",
          });
          return;
        }

        if (params.sourceType === "role")
          setAssignments((prev) => prev.filter((a) => a.talentProfileId !== params.talent.id));
        else if (params.sourceType === "deck")
          setDeck((prev) => prev.filter((d) => d.talentProfileId !== params.talent.id));
        else setPool((prev) => prev.filter((p) => p.id !== params.talent.id));

        if (params.destType === "role") {
          const result = (await response.json()) as MoveResponse;
          if (result.assignment)
            setAssignments((prev) => [
              ...prev,
              { ...result.assignment, talent: params.talent } as AssignmentData,
            ]);
        } else if (params.destType === "deck") {
          const result = (await response.json()) as MoveResponse;
          if (result.deckItem)
            setDeck((prev) => [
              ...prev,
              { ...result.deckItem, talent: params.talent } as DeckItemData,
            ]);
        } else {
          setPool((prev) => [...prev, params.talent]);
        }
        setHasUnsavedChanges(true);
      } catch {
        toast({ title: "Error", description: "Failed to move talent", variant: "destructive" });
      }
    },
    [showId, toast]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const talent = event.active.data.current?.talent as TalentCardData | undefined;
    if (talent) setActiveDragTalent(talent);
  }, []);

  const handleDragEnd = useCallback(
    // eslint-disable-next-line complexity
    (event: DragEndEvent) => {
      setActiveDragTalent(null);
      if (!event.over) return;
      const activeTalent = event.active.data.current?.talent as TalentCardData | undefined;
      if (!activeTalent) return;

      const activeLocation = String(event.active.data.current?.location ?? "pool");
      const overType = String(event.over.data.current?.type ?? "pool");
      const sourceType =
        activeLocation === "role" ? "role" : activeLocation === "deck" ? "deck" : "pool";
      const destType = overType === "role-slot" ? "role" : overType === "deck" ? "deck" : "pool";
      if (sourceType === "pool" && destType === "pool") return;

      void performMove({
        talent: activeTalent,
        sourceType,
        destType,
        activeRoleId: event.active.data.current?.roleId as string | undefined,
        activeSlotIndex: event.active.data.current?.slotIndex as number | undefined,
        overRoleId: event.over.data.current?.roleId as string | undefined,
        overSlotIndex: event.over.data.current?.slotIndex as number | undefined,
      });
    },
    [performMove]
  );

  const handleLockToggle = useCallback(
    (talentId: string, isLocked: boolean) => {
      const assignment = assignments.find((a) => a.talentProfileId === talentId);
      if (!assignment) return;
      void (async () => {
        try {
          const response = await fetch(`/api/shows/${showId}/casting/${assignment.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isLocked }),
          });
          if (response.ok) {
            setAssignments((prev) =>
              prev.map((a) => (a.id === assignment.id ? { ...a, isLocked } : a))
            );
            toast({
              title: isLocked ? "Locked" : "Unlocked",
              description: `Assignment ${isLocked ? "locked" : "unlocked"}`,
            });
          }
        } catch {
          toast({
            title: "Error",
            description: "Failed to update lock status",
            variant: "destructive",
          });
        }
      })();
    },
    [assignments, showId, toast]
  );

  const handleEject = useCallback(
    (talentId: string) => {
      const assignment = assignments.find((a) => a.talentProfileId === talentId);
      if (!assignment || assignment.isLocked) return;
      void (async () => {
        try {
          const response = await fetch(`/api/shows/${showId}/casting/${assignment.id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
            setPool((prev) => [...prev, assignment.talent]);
            setHasUnsavedChanges(true);
          }
        } catch {
          toast({ title: "Error", description: "Failed to remove talent", variant: "destructive" });
        }
      })();
    },
    [assignments, showId, toast]
  );

  const handleRefresh = useCallback(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/shows/${showId}/casting`);
        if (response.ok) {
          const data = (await response.json()) as CastingResponse;
          setAssignments(data.assignments);
          setDeck(data.deck);
          setPool(data.pool);
          setHasUnsavedChanges(false);
          toast({ title: "Refreshed", description: "Board data updated" });
        }
      } catch {
        toast({ title: "Error", description: "Failed to refresh data", variant: "destructive" });
      }
    })();
  }, [showId, toast]);

  const handleBulkLock = useCallback(
    (lock: boolean) => {
      const target = assignments.filter((a) => a.isLocked !== lock);
      if (target.length === 0) return;
      setIsSaving(true);
      void (async () => {
        try {
          const response = await fetch(`/api/shows/${showId}/casting/bulk?operation=lock`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignmentIds: target.map((a) => a.id), isLocked: lock }),
          });
          if (response.ok) {
            setAssignments((prev) => prev.map((a) => ({ ...a, isLocked: lock })));
            toast({
              title: lock ? "Locked" : "Unlocked",
              description: `All assignments ${lock ? "locked" : "unlocked"}`,
            });
          }
        } catch {
          toast({
            title: "Error",
            description: `Failed to ${lock ? "lock" : "unlock"} assignments`,
            variant: "destructive",
          });
        } finally {
          setIsSaving(false);
        }
      })();
    },
    [assignments, showId, toast]
  );

  const rolesByTier = groupRolesByTier(roles);
  const assignmentsByRole = groupAssignmentsByRole(assignments);
  const presenceMap = buildPresenceMap(presence);
  const tierOrder: TierType[] = ["Leads", "Supporting", "Ensemble", "Other"];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col">
        {/* Header - responsive layout */}
        <div className="flex flex-col gap-4 border-b px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold md:text-2xl">Casting Board</h1>
              <p className="text-muted-foreground text-sm">{showTitle}</p>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <PresenceIndicators users={presence} />
              {hasUnsavedChanges && (
                <Badge variant="warning" className="animate-pulse text-xs">
                  Unsaved
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex md:items-center md:gap-2">
              <PresenceIndicators users={presence} />
              {hasUnsavedChanges && (
                <Badge variant="warning" className="animate-pulse">
                  Unsaved changes
                </Badge>
              )}
            </div>
            {/* Action buttons - horizontal scroll on mobile */}
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isSaving}
                className="shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4 md:mr-2", isSaving && "animate-spin")} />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleBulkLock(true);
                }}
                disabled={isSaving}
                className="shrink-0"
              >
                <Lock className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Lock All</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleBulkLock(false);
                }}
                disabled={isSaving}
                className="shrink-0"
              >
                <Unlock className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Unlock All</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCastList(true);
                }}
                disabled={isSaving}
                className="shrink-0"
              >
                <FileText className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Cast List</span>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowNotificationFlow(true);
                }}
                disabled={isSaving || assignments.length === 0}
                className="shrink-0"
              >
                <Mail className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Send Notifications</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main content - stack on mobile, side-by-side on desktop */}
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Roles area */}
          <div className="flex-1 overflow-hidden md:border-r">
            <ScrollArea className="h-full p-4 md:p-6">
              <div className="space-y-4 md:space-y-6">
                {tierOrder.map((tier) => {
                  const tierRoles = rolesByTier[tier];
                  if (tierRoles.length === 0) return null;
                  const totalSlots = tierRoles.reduce((sum, r) => sum + (r.positionCount ?? 1), 0);
                  const filledSlots = tierRoles.reduce(
                    (sum, r) => sum + (assignmentsByRole[r.id]?.length ?? 0),
                    0
                  );
                  return (
                    <TierGroup key={tier} title={tier} count={filledSlots} totalSlots={totalSlots}>
                      {/* Mobile: horizontal scroll for role cards within each tier */}
                      <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
                        <div className="flex gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
                          {tierRoles
                            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                            .map((role) => (
                              <div key={role.id} className="w-[280px] shrink-0 md:w-auto">
                                <RoleCard
                                  role={role}
                                  assignments={
                                    assignmentsByRole[role.id]?.map((a) => ({
                                      roleId: a.roleId,
                                      slotIndex: a.slotIndex,
                                      talent: a.talent,
                                      isLocked: a.isLocked,
                                      status: a.status,
                                    })) ?? []
                                  }
                                  onLockToggle={handleLockToggle}
                                  onEject={handleEject}
                                  selectedTalentId={selectedTalentId}
                                  presenceMap={presenceMap}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    </TierGroup>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Talent pool - collapsible on mobile, fixed width on desktop */}
          <div className="border-t md:w-80 md:shrink-0 md:border-t-0">
            <TalentPool
              talents={pool}
              selectedTalentId={selectedTalentId}
              onSelectTalent={(id) => {
                setSelectedTalentId(id);
              }}
              presenceMap={presenceMap}
            />
          </div>
        </div>

        <div className="border-t">
          <DeckArea
            items={deck.map((d) => ({ talent: d.talent, sortOrder: d.sortOrder, notes: d.notes }))}
            selectedTalentId={selectedTalentId}
            onSelectTalent={(id) => {
              setSelectedTalentId(id);
            }}
            presenceMap={presenceMap}
            isExpanded={isDeckExpanded}
            onToggleExpand={() => {
              setIsDeckExpanded(!isDeckExpanded);
            }}
          />
        </div>
      </div>

      <DragOverlay>
        {activeDragTalent && (
          <div className="opacity-90">
            <TalentCard talent={activeDragTalent} compact disabled />
          </div>
        )}
      </DragOverlay>

      {showNotificationFlow && (
        <SendNotificationFlow
          showId={showId}
          showTitle={showTitle}
          organizationName={organizationName}
          recipients={assignments.map((a) => ({
            id: a.talent.id,
            assignmentId: a.id,
            talentName: `${a.talent.firstName} ${a.talent.lastName}`,
            stageName: a.talent.stageName,
            roleName: roles.find((r) => r.id === a.roleId)?.name ?? "Unknown Role",
            status: a.status,
          }))}
          templates={templates}
          onClose={() => {
            setShowNotificationFlow(false);
          }}
          onSuccess={() => {
            setHasUnsavedChanges(true);
          }}
        />
      )}

      <CastListGenerator
        showId={showId}
        isOpen={showCastList}
        onClose={() => {
          setShowCastList(false);
        }}
      />
    </DndContext>
  );
}
