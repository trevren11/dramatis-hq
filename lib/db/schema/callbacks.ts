import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  index,
  pgEnum,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { auditions } from "./auditions";
import { talentProfiles } from "./talent-profiles";
import { roles } from "./roles";

// Decision options for callbacks (expanded from initial audition)
export const auditionDecisionEnum = pgEnum("audition_decision", [
  "callback", // Move to next round
  "hold_for_role", // Interested but not decided
  "cast_in_role", // Selected for the role
  "release", // Not moving forward
]);

// Callback session status
export const callbackStatusEnum = pgEnum("callback_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

// Time slot interface for scheduling
export interface CallbackTimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  talentProfileId?: string; // Assigned talent
  notes?: string;
}

export interface CallbackScheduleDate {
  date: string; // ISO date string
  slots: CallbackTimeSlot[];
}

// Callback sessions table - represents a callback day/session
export const callbackSessions = pgTable(
  "callback_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditionId: uuid("audition_id")
      .references(() => auditions.id, { onDelete: "cascade" })
      .notNull(),

    // Session Info
    name: varchar("name", { length: 255 }).notNull(),
    round: integer("round").default(1).notNull(), // 1 = first callback, 2 = second callback, etc.
    location: varchar("location", { length: 255 }),
    isVirtual: boolean("is_virtual").default(false),
    notes: text("notes"),

    // Scheduling
    scheduleDates: jsonb("schedule_dates").$type<CallbackScheduleDate[]>().default([]),
    slotDurationMinutes: integer("slot_duration_minutes").default(15),

    // Status
    status: callbackStatusEnum("status").default("scheduled"),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("callback_sessions_audition_id_idx").on(table.auditionId),
    index("callback_sessions_round_idx").on(table.round),
    index("callback_sessions_status_idx").on(table.status),
  ]
);

// Callback invitations - talent invited to callbacks
export const callbackInvitations = pgTable(
  "callback_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    callbackSessionId: uuid("callback_session_id")
      .references(() => callbackSessions.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),

    // Scheduling
    scheduledDate: timestamp("scheduled_date", { mode: "date" }),
    scheduledTime: varchar("scheduled_time", { length: 10 }), // HH:MM format
    timeSlotId: varchar("time_slot_id", { length: 100 }), // Reference to slot in scheduleDates

    // Check-in tracking
    checkedInAt: timestamp("checked_in_at", { mode: "date" }),
    queueNumber: integer("queue_number"),

    // Email notification
    emailSentAt: timestamp("email_sent_at", { mode: "date" }),
    emailStatus: varchar("email_status", { length: 50 }).default("pending"),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("callback_invitations_session_id_idx").on(table.callbackSessionId),
    index("callback_invitations_talent_id_idx").on(table.talentProfileId),
    index("callback_invitations_role_id_idx").on(table.roleId),
    index("callback_invitations_scheduled_date_idx").on(table.scheduledDate),
    index("callback_invitations_queue_number_idx").on(table.queueNumber),
  ]
);

// Audition decisions - tracks decisions across all rounds
export const auditionDecisions = pgTable(
  "audition_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditionId: uuid("audition_id")
      .references(() => auditions.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),

    // Round tracking
    round: integer("round").default(0).notNull(), // 0 = initial audition, 1+ = callbacks
    callbackSessionId: uuid("callback_session_id").references(() => callbackSessions.id, {
      onDelete: "set null",
    }),

    // Decision
    decision: auditionDecisionEnum("decision").notNull(),
    notes: text("notes"),

    // Metadata
    decidedBy: uuid("decided_by"), // User ID of person who made decision
    decidedAt: timestamp("decided_at", { mode: "date" }).defaultNow().notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audition_decisions_audition_id_idx").on(table.auditionId),
    index("audition_decisions_talent_id_idx").on(table.talentProfileId),
    index("audition_decisions_role_id_idx").on(table.roleId),
    index("audition_decisions_round_idx").on(table.round),
    index("audition_decisions_decision_idx").on(table.decision),
    index("audition_decisions_callback_session_idx").on(table.callbackSessionId),
  ]
);

// Callback notes - separate notes for each callback round
export const callbackNotes = pgTable(
  "callback_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    callbackSessionId: uuid("callback_session_id")
      .references(() => callbackSessions.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),

    // Note content
    content: text("content"),

    // Author
    authorId: uuid("author_id"), // User ID

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("callback_notes_session_id_idx").on(table.callbackSessionId),
    index("callback_notes_talent_id_idx").on(table.talentProfileId),
    index("callback_notes_role_id_idx").on(table.roleId),
  ]
);

// Type exports
export type CallbackSession = typeof callbackSessions.$inferSelect;
export type NewCallbackSession = typeof callbackSessions.$inferInsert;
export type CallbackInvitation = typeof callbackInvitations.$inferSelect;
export type NewCallbackInvitation = typeof callbackInvitations.$inferInsert;
export type AuditionDecision = typeof auditionDecisions.$inferSelect;
export type NewAuditionDecision = typeof auditionDecisions.$inferInsert;
export type CallbackNote = typeof callbackNotes.$inferSelect;
export type NewCallbackNote = typeof callbackNotes.$inferInsert;

// Option constants for UI
export const AUDITION_DECISION_OPTIONS = [
  { value: "callback", label: "Callback", description: "Invite to next round" },
  { value: "hold_for_role", label: "Hold for Role", description: "Interested but not decided" },
  { value: "cast_in_role", label: "Cast in Role", description: "Selected for the role" },
  { value: "release", label: "Release", description: "Not moving forward" },
] as const;

export const AUDITION_DECISION_VALUES = [
  "callback",
  "hold_for_role",
  "cast_in_role",
  "release",
] as const;

export const CALLBACK_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const CALLBACK_STATUS_VALUES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
