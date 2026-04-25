import { triggerEvent, CHANNELS, EVENTS } from "../pusher-server";

// Types for casting events
export interface TalentInfo {
  id: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  primaryHeadshotUrl: string | null;
}

export interface CastingAssignment {
  id: string;
  showId: string;
  roleId: string;
  talentProfileId: string;
  slotIndex: number;
  status: "draft" | "tentative" | "confirmed" | "declined";
  isLocked: boolean;
  talent: TalentInfo;
}

export interface DeckItem {
  id: string;
  showId: string;
  talentProfileId: string;
  sortOrder: number;
  notes: string | null;
  talent: TalentInfo;
}

export interface TalentAddedEvent {
  assignment: CastingAssignment;
  userId: string;
  timestamp: string;
}

export interface TalentRemovedEvent {
  assignmentId: string;
  roleId: string;
  slotIndex: number;
  talentProfileId: string;
  userId: string;
  timestamp: string;
}

export interface TalentMovedEvent {
  type: "assignment" | "deck" | "pool";
  fromType: "assignment" | "deck" | "pool";
  assignment?: CastingAssignment;
  deckItem?: DeckItem;
  talentProfileId: string;
  userId: string;
  timestamp: string;
}

export interface CastingUpdatedEvent {
  assignmentId: string;
  changes: Partial<CastingAssignment>;
  userId: string;
  timestamp: string;
}

// Broadcast functions
export async function broadcastTalentAdded(
  showId: string,
  assignment: CastingAssignment,
  userId: string
): Promise<void> {
  await triggerEvent<TalentAddedEvent>(CHANNELS.casting(showId), EVENTS.TALENT_ADDED, {
    assignment,
    userId,
    timestamp: new Date().toISOString(),
  });
}

export async function broadcastTalentRemoved(
  showId: string,
  assignmentId: string,
  roleId: string,
  slotIndex: number,
  talentProfileId: string,
  userId: string
): Promise<void> {
  await triggerEvent<TalentRemovedEvent>(CHANNELS.casting(showId), EVENTS.TALENT_REMOVED, {
    assignmentId,
    roleId,
    slotIndex,
    talentProfileId,
    userId,
    timestamp: new Date().toISOString(),
  });
}

export async function broadcastTalentMoved(
  showId: string,
  event: Omit<TalentMovedEvent, "timestamp">
): Promise<void> {
  await triggerEvent<TalentMovedEvent>(CHANNELS.casting(showId), EVENTS.TALENT_MOVED, {
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export async function broadcastCastingUpdated(
  showId: string,
  assignmentId: string,
  changes: Partial<CastingAssignment>,
  userId: string
): Promise<void> {
  await triggerEvent<CastingUpdatedEvent>(CHANNELS.casting(showId), EVENTS.CASTING_UPDATED, {
    assignmentId,
    changes,
    userId,
    timestamp: new Date().toISOString(),
  });
}
