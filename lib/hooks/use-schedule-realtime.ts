"use client";

import { useMemo } from "react";
import { useRealtimeChannel, type ConnectionState } from "./use-realtime";
import { CHANNELS, EVENTS } from "@/lib/realtime-constants";

interface ScheduleEvent {
  id: string;
  showId: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
  color: string;
}

interface ScheduleCreatedEvent {
  event: ScheduleEvent;
  showId: string;
}

interface ScheduleUpdatedEvent {
  event: ScheduleEvent;
  eventId: string;
  showId: string;
}

interface ScheduleDeletedEvent {
  eventId: string;
  showId: string;
}

interface UseScheduleRealtimeOptions {
  onEventCreated?: (event: ScheduleEvent) => void;
  onEventUpdated?: (event: ScheduleEvent) => void;
  onEventDeleted?: (eventId: string) => void;
  enabled?: boolean;
}

interface UseScheduleRealtimeReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  error: Error | null;
}

export function useScheduleRealtime(
  showId: string,
  options: UseScheduleRealtimeOptions = {}
): UseScheduleRealtimeReturn {
  const { onEventCreated, onEventUpdated, onEventDeleted, enabled = true } = options;

  const scheduleChannel = CHANNELS.schedule(showId);

  const events = useMemo(
    () => ({
      [EVENTS.SCHEDULE_CREATED]: (data: unknown) => {
        const event = data as ScheduleCreatedEvent;
        onEventCreated?.(event.event);
      },
      [EVENTS.SCHEDULE_UPDATED]: (data: unknown) => {
        const event = data as ScheduleUpdatedEvent;
        onEventUpdated?.(event.event);
      },
      [EVENTS.SCHEDULE_DELETED]: (data: unknown) => {
        const event = data as ScheduleDeletedEvent;
        onEventDeleted?.(event.eventId);
      },
    }),
    [onEventCreated, onEventUpdated, onEventDeleted]
  );

  const { isConnected, connectionState, error } = useRealtimeChannel(scheduleChannel, events, {
    enabled,
  });

  return {
    isConnected,
    connectionState,
    error,
  };
}
