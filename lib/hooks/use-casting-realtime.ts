"use client";

import { useRealtimeChannel } from "./use-realtime";
import { usePresence } from "./use-presence";
import { EVENTS } from "@/lib/realtime-constants";

interface TalentAddedEvent {
  assignment: {
    id: string;
    showId: string;
    roleId: string;
    talentProfileId: string;
    slotIndex: number;
    status: string;
    isLocked: boolean;
  };
  talentProfileId: string;
  roleId: string;
  slotIndex: number;
}

interface TalentRemovedEvent {
  talentProfileId: string;
  destination: string;
}

interface CastingUpdatedEvent {
  type: string;
  deckItem?: {
    id: string;
    showId: string;
    talentProfileId: string;
    sortOrder: number;
  };
  talentProfileId: string;
}

interface UseCastingRealtimeOptions {
  onTalentAdded?: (event: TalentAddedEvent) => void;
  onTalentRemoved?: (event: TalentRemovedEvent) => void;
  onCastingUpdated?: (event: CastingUpdatedEvent) => void;
  onRefreshNeeded?: () => void;
  enabled?: boolean;
}

export function useCastingRealtime(showId: string, options: UseCastingRealtimeOptions = {}) {
  const { onTalentAdded, onTalentRemoved, onCastingUpdated, onRefreshNeeded, enabled = true } =
    options;

  // Build channel name using the same pattern as server
  const castingChannel = `private-casting-show-${showId}`;
  const presenceChannel = `presence-show-${showId}`;

  // Subscribe to casting events
  const events = {
    [EVENTS.TALENT_ADDED]: (data: unknown) => {
      const event = data as TalentAddedEvent;
      onTalentAdded?.(event);
      onRefreshNeeded?.();
    },
    [EVENTS.TALENT_REMOVED]: (data: unknown) => {
      const event = data as TalentRemovedEvent;
      onTalentRemoved?.(event);
      onRefreshNeeded?.();
    },
    [EVENTS.CASTING_UPDATED]: (data: unknown) => {
      const event = data as CastingUpdatedEvent;
      onCastingUpdated?.(event);
      onRefreshNeeded?.();
    },
  };

  const { isConnected, connectionState, error } = useRealtimeChannel(castingChannel, events, {
    enabled,
  });

  // Subscribe to presence channel for viewing indicators
  const {
    members,
    me,
    count: viewerCount,
  } = usePresence(presenceChannel, { enabled });

  return {
    isConnected,
    connectionState,
    error,
    viewers: members,
    me,
    viewerCount,
  };
}
