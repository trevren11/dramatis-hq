import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  index,
  boolean,
  pgEnum,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { roles } from "./roles";
import { talentProfiles } from "./talent-profiles";
import { users } from "./users";

export const scheduleEventTypeEnum = pgEnum("schedule_event_type", [
  "rehearsal",
  "performance",
  "tech_rehearsal",
  "dress_rehearsal",
  "photo_call",
  "load_in",
  "strike",
  "custom",
]);

export const scheduleEventStatusEnum = pgEnum("schedule_event_status", [
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
]);

export const scheduleNotificationTypeEnum = pgEnum("schedule_notification_type", [
  "event_created",
  "event_updated",
  "event_cancelled",
  "event_reminder",
  "daily_digest",
  "weekly_digest",
]);

export const scheduleEvents = pgTable(
  "schedule_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    eventType: scheduleEventTypeEnum("event_type").default("rehearsal").notNull(),
    status: scheduleEventStatusEnum("status").default("scheduled").notNull(),

    location: varchar("location", { length: 255 }),
    startTime: timestamp("start_time", { mode: "date", withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { mode: "date", withTimezone: true }).notNull(),

    isAllCast: boolean("is_all_cast").default(false).notNull(),

    notes: text("notes"),
    attachments: jsonb("attachments").$type<
      {
        id: string;
        name: string;
        url: string;
        type: string;
        size: number;
      }[]
    >(),

    icalUid: uuid("ical_uid").defaultRandom().unique(),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("schedule_events_show_id_idx").on(table.showId),
    index("schedule_events_event_type_idx").on(table.eventType),
    index("schedule_events_status_idx").on(table.status),
    index("schedule_events_start_time_idx").on(table.startTime),
    index("schedule_events_end_time_idx").on(table.endTime),
    index("schedule_events_ical_uid_idx").on(table.icalUid),
  ]
);

export const eventCast = pgTable(
  "event_cast",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .references(() => scheduleEvents.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),

    notifiedAt: timestamp("notified_at", { mode: "date" }),
    acknowledgedAt: timestamp("acknowledged_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("event_cast_event_id_idx").on(table.eventId),
    index("event_cast_talent_id_idx").on(table.talentProfileId),
    index("event_cast_role_id_idx").on(table.roleId),
    unique("event_cast_unique_talent_event").on(table.eventId, table.talentProfileId),
  ]
);

export const scheduleNotifications = pgTable(
  "schedule_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .references(() => scheduleEvents.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    type: scheduleNotificationTypeEnum("type").notNull(),
    subject: varchar("subject", { length: 500 }),
    body: text("body"),

    sentAt: timestamp("sent_at", { mode: "date" }),
    readAt: timestamp("read_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("schedule_notifications_event_id_idx").on(table.eventId),
    index("schedule_notifications_user_id_idx").on(table.userId),
    index("schedule_notifications_type_idx").on(table.type),
    index("schedule_notifications_sent_at_idx").on(table.sentAt),
  ]
);

export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type NewScheduleEvent = typeof scheduleEvents.$inferInsert;
export type EventCast = typeof eventCast.$inferSelect;
export type NewEventCast = typeof eventCast.$inferInsert;
export type ScheduleNotification = typeof scheduleNotifications.$inferSelect;
export type NewScheduleNotification = typeof scheduleNotifications.$inferInsert;

export const SCHEDULE_EVENT_TYPE_OPTIONS = [
  { value: "rehearsal", label: "Rehearsal", color: "#3b82f6" },
  { value: "performance", label: "Performance", color: "#22c55e" },
  { value: "tech_rehearsal", label: "Tech Rehearsal", color: "#f97316" },
  { value: "dress_rehearsal", label: "Dress Rehearsal", color: "#8b5cf6" },
  { value: "photo_call", label: "Photo Call", color: "#ec4899" },
  { value: "load_in", label: "Load-In", color: "#6b7280" },
  { value: "strike", label: "Strike", color: "#ef4444" },
  { value: "custom", label: "Custom", color: "#06b6d4" },
] as const;

export const SCHEDULE_EVENT_TYPE_VALUES = [
  "rehearsal",
  "performance",
  "tech_rehearsal",
  "dress_rehearsal",
  "photo_call",
  "load_in",
  "strike",
  "custom",
] as const;

export const SCHEDULE_EVENT_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
] as const;

export const SCHEDULE_EVENT_STATUS_VALUES = [
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
] as const;

export const SCHEDULE_NOTIFICATION_TYPE_OPTIONS = [
  { value: "event_created", label: "Event Created" },
  { value: "event_updated", label: "Event Updated" },
  { value: "event_cancelled", label: "Event Cancelled" },
  { value: "event_reminder", label: "Event Reminder" },
  { value: "daily_digest", label: "Daily Digest" },
  { value: "weekly_digest", label: "Weekly Digest" },
] as const;

export const SCHEDULE_NOTIFICATION_TYPE_VALUES = [
  "event_created",
  "event_updated",
  "event_cancelled",
  "event_reminder",
  "daily_digest",
  "weekly_digest",
] as const;

export const getEventTypeColor = (
  eventType: (typeof SCHEDULE_EVENT_TYPE_VALUES)[number]
): string => {
  const option = SCHEDULE_EVENT_TYPE_OPTIONS.find((opt) => opt.value === eventType);
  return option?.color ?? "#6b7280";
};
