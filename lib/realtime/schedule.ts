import { triggerEvent, CHANNELS, EVENTS } from "../pusher-server";

// Types for schedule events
export interface ScheduleEvent {
  id: string;
  showId: string;
  title: string;
  eventType: string;
  startTime: Date | string;
  endTime: Date | string;
  location: string | null;
  notes: string | null;
  status: string;
  color: string;
}

export interface ScheduleCreatedEvent {
  event: ScheduleEvent;
  showId: string;
}

export interface ScheduleUpdatedEvent {
  eventId: string;
  changes: Partial<ScheduleEvent>;
  showId: string;
  userId: string;
}

export interface ScheduleDeletedEvent {
  eventId: string;
  showId: string;
  userId: string;
}

// Broadcast functions
export async function broadcastScheduleCreated(
  showId: string,
  event: ScheduleEvent
): Promise<void> {
  await triggerEvent<ScheduleCreatedEvent>(CHANNELS.schedule(showId), EVENTS.SCHEDULE_CREATED, {
    event,
    showId,
  });
}

export async function broadcastScheduleUpdated(
  showId: string,
  eventId: string,
  changes: Partial<ScheduleEvent>,
  userId: string
): Promise<void> {
  await triggerEvent<ScheduleUpdatedEvent>(CHANNELS.schedule(showId), EVENTS.SCHEDULE_UPDATED, {
    eventId,
    changes,
    showId,
    userId,
  });
}

export async function broadcastScheduleDeleted(
  showId: string,
  eventId: string,
  userId: string
): Promise<void> {
  await triggerEvent<ScheduleDeletedEvent>(CHANNELS.schedule(showId), EVENTS.SCHEDULE_DELETED, {
    eventId,
    showId,
    userId,
  });
}
