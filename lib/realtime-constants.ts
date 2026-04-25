/**
 * Shared constants for real-time channels and events
 * Can be imported from both client and server code
 */

// Channel naming conventions
export const CHANNELS = {
  casting: (showId: string) => `private-casting-show-${showId}`,
  schedule: (showId: string) => `private-schedule-show-${showId}`,
  chat: (conversationId: string) => `private-chat-conv-${conversationId}`,
  presence: (showId: string) => `presence-show-${showId}`,
  notifications: (userId: string) => `private-notifications-${userId}`,
} as const;

// Event types for type safety
export const EVENTS = {
  // Casting events
  TALENT_ADDED: "talent:added",
  TALENT_REMOVED: "talent:removed",
  TALENT_MOVED: "talent:moved",
  CASTING_UPDATED: "casting:updated",

  // Schedule events
  SCHEDULE_CREATED: "schedule:created",
  SCHEDULE_UPDATED: "schedule:updated",
  SCHEDULE_DELETED: "schedule:deleted",

  // Chat events
  MESSAGE_SENT: "message:sent",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_READ: "message:read",
  TYPING_START: "client-typing:start",
  TYPING_STOP: "client-typing:stop",

  // Presence events
  MEMBER_ADDED: "pusher:member_added",
  MEMBER_REMOVED: "pusher:member_removed",
  SUBSCRIPTION_SUCCEEDED: "pusher:subscription_succeeded",

  // Notification events
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
} as const;

export type ChannelType = keyof typeof CHANNELS;
export type EventType = (typeof EVENTS)[keyof typeof EVENTS];
