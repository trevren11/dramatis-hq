import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  index,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Notification types for in-app and push notifications
export const inAppNotificationTypeEnum = pgEnum("in_app_notification_type", [
  "new_message",
  "schedule_change",
  "rehearsal_reminder",
  "callback_notification",
  "cast_decision",
  "document_shared",
  "comment_mention",
  "audition_submission",
  "system_announcement",
]);

// Push subscription table for web push
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Web Push subscription data
    endpoint: text("endpoint").notNull(),
    keys: jsonb("keys")
      .$type<{
        p256dh: string;
        auth: string;
      }>()
      .notNull(),

    // Device info for management
    userAgent: text("user_agent"),
    deviceName: varchar("device_name", { length: 255 }),

    // Subscription status
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("push_subscriptions_user_id_idx").on(table.userId),
    index("push_subscriptions_endpoint_idx").on(table.endpoint),
    index("push_subscriptions_is_active_idx").on(table.isActive),
  ]
);

// In-app notifications
export const inAppNotifications = pgTable(
  "in_app_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    type: inAppNotificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),

    // Navigation data
    data: jsonb("data").$type<{
      url?: string;
      entityType?: string;
      entityId?: string;
      [key: string]: unknown;
    }>(),

    // Status tracking
    readAt: timestamp("read_at", { mode: "date" }),
    clickedAt: timestamp("clicked_at", { mode: "date" }),

    // Push notification sent status
    pushSentAt: timestamp("push_sent_at", { mode: "date" }),
    pushError: text("push_error"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("in_app_notifications_user_id_idx").on(table.userId),
    index("in_app_notifications_type_idx").on(table.type),
    index("in_app_notifications_read_at_idx").on(table.readAt),
    index("in_app_notifications_created_at_idx").on(table.createdAt),
  ]
);

// Notification preferences per type
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Push notification master toggle
    pushEnabled: boolean("push_enabled").default(true).notNull(),

    // Per-type preferences
    newMessage: boolean("new_message").default(true).notNull(),
    scheduleChange: boolean("schedule_change").default(true).notNull(),
    rehearsalReminder: boolean("rehearsal_reminder").default(true).notNull(),
    callbackNotification: boolean("callback_notification").default(true).notNull(),
    castDecision: boolean("cast_decision").default(true).notNull(),
    documentShared: boolean("document_shared").default(true).notNull(),
    commentMention: boolean("comment_mention").default(true).notNull(),
    auditionSubmission: boolean("audition_submission").default(true).notNull(),
    systemAnnouncement: boolean("system_announcement").default(true).notNull(),

    // Do not disturb settings
    dndEnabled: boolean("dnd_enabled").default(false).notNull(),
    dndStart: varchar("dnd_start", { length: 5 }), // HH:MM format
    dndEnd: varchar("dnd_end", { length: 5 }), // HH:MM format
    timezone: varchar("timezone", { length: 100 }).default("UTC"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("notif_prefs_user_id_idx").on(table.userId)]
);

// Type exports
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type NewInAppNotification = typeof inAppNotifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

// Notification type values
export const IN_APP_NOTIFICATION_TYPE_VALUES = [
  "new_message",
  "schedule_change",
  "rehearsal_reminder",
  "callback_notification",
  "cast_decision",
  "document_shared",
  "comment_mention",
  "audition_submission",
  "system_announcement",
] as const;

export type InAppNotificationType = (typeof IN_APP_NOTIFICATION_TYPE_VALUES)[number];

// Human-readable labels for notification types
export const NOTIFICATION_TYPE_LABELS: Record<InAppNotificationType, string> = {
  new_message: "New Messages",
  schedule_change: "Schedule Changes",
  rehearsal_reminder: "Rehearsal Reminders",
  callback_notification: "Callback Notifications",
  cast_decision: "Casting Decisions",
  document_shared: "Shared Documents",
  comment_mention: "Comments & Mentions",
  audition_submission: "Audition Submissions",
  system_announcement: "System Announcements",
};

// Notification type descriptions
export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<InAppNotificationType, string> = {
  new_message: "Receive notifications when you get new messages",
  schedule_change: "Get alerted when rehearsal or performance schedules change",
  rehearsal_reminder: "Reminders before your scheduled rehearsals",
  callback_notification: "Notifications about callback invitations",
  cast_decision: "Updates about casting decisions for your auditions",
  document_shared: "Alerts when scripts or documents are shared with you",
  comment_mention: "Notifications when someone mentions you in comments",
  audition_submission: "Confirmations when talent submit audition materials",
  system_announcement: "Important system-wide announcements",
};

// Notification type to preference field mapping
export const NOTIFICATION_TYPE_TO_FIELD: Record<
  InAppNotificationType,
  keyof NotificationPreference
> = {
  new_message: "newMessage",
  schedule_change: "scheduleChange",
  rehearsal_reminder: "rehearsalReminder",
  callback_notification: "callbackNotification",
  cast_decision: "castDecision",
  document_shared: "documentShared",
  comment_mention: "commentMention",
  audition_submission: "auditionSubmission",
  system_announcement: "systemAnnouncement",
};
