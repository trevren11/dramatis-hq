import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  boolean,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { talentProfiles } from "./talent-profiles";

export const availabilityStatusEnum = pgEnum("availability_status", [
  "available",
  "unavailable",
  "tentative",
]);

export const recurrencePatternEnum = pgEnum("recurrence_pattern", [
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);

export const availability = pgTable(
  "availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    status: availabilityStatusEnum("status").notNull().default("available"),
    isAllDay: boolean("is_all_day").default(true),
    notes: text("notes"),

    // Recurrence settings
    recurrencePattern: recurrencePatternEnum("recurrence_pattern").default("none"),
    recurrenceEndDate: timestamp("recurrence_end_date", { mode: "date" }),

    // iCal sync token for external subscriptions
    icalToken: uuid("ical_token").defaultRandom().unique(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("availability_talent_profile_id_idx").on(table.talentProfileId),
    index("availability_date_range_idx").on(table.startDate, table.endDate),
    index("availability_status_idx").on(table.status),
    index("availability_ical_token_idx").on(table.icalToken),
  ]
);

export const showScheduleStatusEnum = pgEnum("show_schedule_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);

export const showSchedules = pgTable(
  "show_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    showName: varchar("show_name", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }),
    venue: varchar("venue", { length: 255 }),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    status: showScheduleStatusEnum("show_schedule_status").notNull().default("confirmed"),

    // Privacy: only share minimal info in external calendar
    isPublic: boolean("is_public").default(false),

    // Metadata for show (could link to show entity in future)
    showMetadata: jsonb("show_metadata").$type<{
      productionCompany?: string;
      director?: string;
      castingDirector?: string;
    }>(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("show_schedules_talent_profile_id_idx").on(table.talentProfileId),
    index("show_schedules_date_range_idx").on(table.startDate, table.endDate),
    index("show_schedules_status_idx").on(table.status),
  ]
);

export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;
export type ShowSchedule = typeof showSchedules.$inferSelect;
export type NewShowSchedule = typeof showSchedules.$inferInsert;

export const AVAILABILITY_STATUSES = ["available", "unavailable", "tentative"] as const;

export const AVAILABILITY_STATUS_LABELS: Record<(typeof AVAILABILITY_STATUSES)[number], string> = {
  available: "Available",
  unavailable: "Unavailable",
  tentative: "Tentative",
};

export const AVAILABILITY_STATUS_COLORS: Record<(typeof AVAILABILITY_STATUSES)[number], string> = {
  available: "#22c55e", // green
  unavailable: "#ef4444", // red
  tentative: "#3b82f6", // blue
};

export const RECURRENCE_PATTERNS = ["none", "daily", "weekly", "biweekly", "monthly"] as const;

export const RECURRENCE_PATTERN_LABELS: Record<(typeof RECURRENCE_PATTERNS)[number], string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export const SHOW_SCHEDULE_STATUSES = ["confirmed", "tentative", "cancelled"] as const;

export const SHOW_SCHEDULE_STATUS_LABELS: Record<
  (typeof SHOW_SCHEDULE_STATUSES)[number],
  string
> = {
  confirmed: "Confirmed",
  tentative: "Tentative",
  cancelled: "Cancelled",
};
