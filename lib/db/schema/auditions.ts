import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  jsonb,
  index,
  pgEnum,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import { producerProfiles } from "./producer-profiles";
import { shows } from "./shows";
import { roles } from "./roles";
import { talentProfiles } from "./talent-profiles";
import { users } from "./users";

// Enums
export const auditionVisibilityEnum = pgEnum("audition_visibility", [
  "public",
  "private",
  "unlisted",
]);

export const auditionStatusEnum = pgEnum("audition_status", [
  "draft",
  "open",
  "closed",
  "cancelled",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "submitted",
  "reviewed",
  "callback",
  "rejected",
  "cast",
]);

export const checkinStatusEnum = pgEnum("checkin_status", ["checked_in", "in_room", "completed"]);

// Types for JSONB fields
export interface AuditionDate {
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format
  notes?: string;
}

export interface AuditionRequirements {
  unionStatus?: "union" | "non_union" | "both";
  ageRangeMin?: number;
  ageRangeMax?: number;
  gender?: string[];
  ethnicities?: string[];
  specialSkills?: string[];
  other?: string;
}

export interface AuditionMaterials {
  requireHeadshot?: boolean;
  requireResume?: boolean;
  requireVideo?: boolean;
  requireAudio?: boolean;
  videoInstructions?: string;
  audioInstructions?: string;
  additionalInstructions?: string;
  customFields?: {
    label: string;
    type: "text" | "file" | "url";
    required: boolean;
  }[];
}

export interface ApplicationMaterials {
  headshotId?: string;
  resumeId?: string;
  videoUrl?: string;
  audioUrl?: string;
  customResponses?: Record<string, string>;
}

// Form Builder types
export const FORM_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "multiselect",
  "boolean",
  "date",
  "file",
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[]; // for select/multiselect
  profileMapping?: string; // auto-fill from profile field
  placeholder?: string;
}

export type FormResponses = Record<string, string | string[] | boolean | null>;

// Main auditions table
export const auditions = pgTable(
  "auditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Basic Info
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 255 }).notNull().unique(),

    // Location
    location: varchar("location", { length: 255 }),
    isVirtual: boolean("is_virtual").default(false),

    // Dates
    auditionDates: jsonb("audition_dates").$type<AuditionDate[]>().default([]),
    submissionDeadline: timestamp("submission_deadline", { mode: "date" }),

    // Requirements & Materials
    requirements: jsonb("requirements").$type<AuditionRequirements>().default({}),
    materials: jsonb("materials").$type<AuditionMaterials>().default({}),

    // Visibility & Status
    visibility: auditionVisibilityEnum("visibility").default("public"),
    publishAt: timestamp("publish_at", { mode: "date" }),
    status: auditionStatusEnum("status").default("draft"),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("auditions_show_id_idx").on(table.showId),
    index("auditions_organization_id_idx").on(table.organizationId),
    index("auditions_slug_idx").on(table.slug),
    index("auditions_status_idx").on(table.status),
    index("auditions_visibility_idx").on(table.visibility),
    index("auditions_publish_at_idx").on(table.publishAt),
    index("auditions_submission_deadline_idx").on(table.submissionDeadline),
  ]
);

// Junction table linking auditions to roles being cast
export const auditionRoles = pgTable(
  "audition_roles",
  {
    auditionId: uuid("audition_id")
      .references(() => auditions.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.auditionId, table.roleId] }),
    index("audition_roles_audition_id_idx").on(table.auditionId),
    index("audition_roles_role_id_idx").on(table.roleId),
  ]
);

// Applications from talent
export const auditionApplications = pgTable(
  "audition_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditionId: uuid("audition_id")
      .references(() => auditions.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Application Details
    status: applicationStatusEnum("status").default("submitted"),
    materials: jsonb("materials").$type<ApplicationMaterials>().default({}),
    notes: text("notes"), // Producer notes

    // Timestamps
    submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  },
  (table) => [
    index("audition_applications_audition_id_idx").on(table.auditionId),
    index("audition_applications_talent_profile_id_idx").on(table.talentProfileId),
    index("audition_applications_status_idx").on(table.status),
    index("audition_applications_submitted_at_idx").on(table.submittedAt),
  ]
);

// Form builder - custom audition forms
export const auditionForms = pgTable(
  "audition_forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditionId: uuid("audition_id")
      .references(() => auditions.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // One form per audition
    fields: jsonb("fields").$type<FormField[]>().default([]),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("audition_forms_audition_id_idx").on(table.auditionId)]
);

// Form responses and check-in tracking
export const auditionFormResponses = pgTable(
  "audition_form_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditionId: uuid("audition_id")
      .references(() => auditions.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    responses: jsonb("responses").$type<FormResponses>().default({}),
    checkedInAt: timestamp("checked_in_at", { mode: "date" }),
    queueNumber: integer("queue_number"),
    status: checkinStatusEnum("status").default("checked_in"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audition_form_responses_audition_id_idx").on(table.auditionId),
    index("audition_form_responses_talent_profile_id_idx").on(table.talentProfileId),
    index("audition_form_responses_status_idx").on(table.status),
    index("audition_form_responses_queue_number_idx").on(table.queueNumber),
    index("audition_form_responses_checked_in_at_idx").on(table.checkedInAt),
  ]
);

// Audition notes - private notes per talent
export const auditionNotes = pgTable(
  "audition_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditionId: uuid("audition_id")
      .references(() => auditions.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    note: text("note").notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audition_notes_audition_id_idx").on(table.auditionId),
    index("audition_notes_talent_profile_id_idx").on(table.talentProfileId),
    index("audition_notes_created_by_idx").on(table.createdBy),
    index("audition_notes_created_at_idx").on(table.createdAt),
  ]
);

// Type exports
export type Audition = typeof auditions.$inferSelect;
export type NewAudition = typeof auditions.$inferInsert;
export type AuditionRole = typeof auditionRoles.$inferSelect;
export type NewAuditionRole = typeof auditionRoles.$inferInsert;
export type AuditionApplication = typeof auditionApplications.$inferSelect;
export type NewAuditionApplication = typeof auditionApplications.$inferInsert;
export type AuditionForm = typeof auditionForms.$inferSelect;
export type NewAuditionForm = typeof auditionForms.$inferInsert;
export type AuditionFormResponse = typeof auditionFormResponses.$inferSelect;
export type NewAuditionFormResponse = typeof auditionFormResponses.$inferInsert;
export type AuditionNote = typeof auditionNotes.$inferSelect;
export type NewAuditionNote = typeof auditionNotes.$inferInsert;

// Option constants for UI
export const AUDITION_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "unlisted", label: "Unlisted" },
] as const;

export const AUDITION_VISIBILITY_VALUES = ["public", "private", "unlisted"] as const;

export const AUDITION_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const AUDITION_STATUS_VALUES = ["draft", "open", "closed", "cancelled"] as const;

export const APPLICATION_STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "callback", label: "Callback" },
  { value: "rejected", label: "Rejected" },
  { value: "cast", label: "Cast" },
] as const;

export const APPLICATION_STATUS_VALUES = [
  "submitted",
  "reviewed",
  "callback",
  "rejected",
  "cast",
] as const;

export const CHECKIN_STATUS_OPTIONS = [
  { value: "checked_in", label: "Checked In" },
  { value: "in_room", label: "In Room" },
  { value: "completed", label: "Completed" },
] as const;

export const CHECKIN_STATUS_VALUES = ["checked_in", "in_room", "completed"] as const;
