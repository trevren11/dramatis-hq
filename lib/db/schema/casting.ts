import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  index,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { roles } from "./roles";
import { talentProfiles } from "./talent-profiles";
import { users } from "./users";

export const castingStatusEnum = pgEnum("casting_status", [
  "draft",
  "tentative",
  "confirmed",
  "declined",
]);

export const castingAssignments = pgTable(
  "casting_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),

    slotIndex: integer("slot_index").default(0).notNull(),
    status: castingStatusEnum("status").default("draft").notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    notes: text("notes"),
    assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at", { mode: "date" }).defaultNow().notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("casting_assignments_show_id_idx").on(table.showId),
    index("casting_assignments_role_id_idx").on(table.roleId),
    index("casting_assignments_talent_id_idx").on(table.talentProfileId),
    index("casting_assignments_status_idx").on(table.status),
    unique("casting_assignments_unique_talent_show").on(table.showId, table.talentProfileId),
    unique("casting_assignments_unique_role_slot").on(table.roleId, table.slotIndex),
  ]
);

export const castingDeck = pgTable(
  "casting_deck",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),

    sortOrder: integer("sort_order").default(0).notNull(),
    notes: text("notes"),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at", { mode: "date" }).defaultNow().notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("casting_deck_show_id_idx").on(table.showId),
    index("casting_deck_talent_id_idx").on(table.talentProfileId),
    index("casting_deck_sort_order_idx").on(table.sortOrder),
    unique("casting_deck_unique_talent_show").on(table.showId, table.talentProfileId),
  ]
);

export const castingPresence = pgTable(
  "casting_presence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    userName: varchar("user_name", { length: 255 }).notNull(),
    cursorPosition: varchar("cursor_position", { length: 100 }),
    selectedTalentId: uuid("selected_talent_id"),
    color: varchar("color", { length: 7 }),
    lastSeenAt: timestamp("last_seen_at", { mode: "date" }).defaultNow().notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("casting_presence_show_id_idx").on(table.showId),
    index("casting_presence_user_id_idx").on(table.userId),
    index("casting_presence_last_seen_idx").on(table.lastSeenAt),
    unique("casting_presence_unique_user_show").on(table.showId, table.userId),
  ]
);

export type CastingAssignment = typeof castingAssignments.$inferSelect;
export type NewCastingAssignment = typeof castingAssignments.$inferInsert;
export type CastingDeckItem = typeof castingDeck.$inferSelect;
export type NewCastingDeckItem = typeof castingDeck.$inferInsert;
export type CastingPresence = typeof castingPresence.$inferSelect;
export type NewCastingPresence = typeof castingPresence.$inferInsert;

export const CASTING_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "tentative", label: "Tentative" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
] as const;

export const CASTING_STATUS_VALUES = ["draft", "tentative", "confirmed", "declined"] as const;

export const PRESENCE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
] as const;
