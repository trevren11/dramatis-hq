import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { producerProfiles, unionStatusEnum } from "./producer-profiles";

export const showTypeEnum = pgEnum("show_type", [
  "musical",
  "play",
  "opera",
  "dance",
  "concert",
  "other",
]);

export const showStatusEnum = pgEnum("show_status", [
  "planning",
  "auditions",
  "rehearsal",
  "running",
  "closed",
]);

export const shows = pgTable(
  "shows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Basic Info
    title: varchar("title", { length: 255 }).notNull(),
    type: showTypeEnum("type").default("play"),
    description: text("description"),

    // Venue
    venue: varchar("venue", { length: 255 }),

    // Dates
    rehearsalStart: timestamp("rehearsal_start", { mode: "date" }),
    performanceStart: timestamp("performance_start", { mode: "date" }),
    performanceEnd: timestamp("performance_end", { mode: "date" }),

    // Settings
    unionStatus: unionStatusEnum("union_status").default("both"),
    status: showStatusEnum("status").default("planning"),
    isPublic: boolean("is_public").default(true),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("shows_organization_id_idx").on(table.organizationId),
    index("shows_status_idx").on(table.status),
    index("shows_is_public_idx").on(table.isPublic),
  ]
);

export type Show = typeof shows.$inferSelect;
export type NewShow = typeof shows.$inferInsert;

export const SHOW_TYPE_OPTIONS = [
  { value: "musical", label: "Musical" },
  { value: "play", label: "Play" },
  { value: "opera", label: "Opera" },
  { value: "dance", label: "Dance" },
  { value: "concert", label: "Concert" },
  { value: "other", label: "Other" },
] as const;

export const SHOW_TYPE_VALUES = ["musical", "play", "opera", "dance", "concert", "other"] as const;

export const SHOW_STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "auditions", label: "Auditions" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "running", label: "Running" },
  { value: "closed", label: "Closed" },
] as const;

export const SHOW_STATUS_VALUES = [
  "planning",
  "auditions",
  "rehearsal",
  "running",
  "closed",
] as const;
