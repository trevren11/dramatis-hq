import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";

export const roleTypeEnum = pgEnum("role_type", [
  "lead",
  "supporting",
  "ensemble",
  "understudy",
  "swing",
]);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),

    // Basic Info
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: roleTypeEnum("type").default("supporting"),

    // Character Details
    ageRangeMin: integer("age_range_min"),
    ageRangeMax: integer("age_range_max"),
    vocalRange: varchar("vocal_range", { length: 100 }),
    notes: text("notes"),

    // Casting
    positionCount: integer("position_count").default(1),
    sortOrder: integer("sort_order").default(0),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("roles_show_id_idx").on(table.showId),
    index("roles_sort_order_idx").on(table.sortOrder),
  ]
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export const ROLE_TYPE_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "supporting", label: "Supporting" },
  { value: "ensemble", label: "Ensemble" },
  { value: "understudy", label: "Understudy" },
  { value: "swing", label: "Swing" },
] as const;

export const ROLE_TYPE_VALUES = ["lead", "supporting", "ensemble", "understudy", "swing"] as const;
