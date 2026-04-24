import { pgTable, uuid, varchar, timestamp, integer, text, index } from "drizzle-orm/pg-core";
import { talentProfiles } from "./talent-profiles";

export const education = pgTable(
  "education",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    program: varchar("program", { length: 255 }).notNull(),
    degree: varchar("degree", { length: 100 }),
    institution: varchar("institution", { length: 255 }).notNull(),
    location: varchar("location", { length: 200 }),
    startYear: integer("start_year"),
    endYear: integer("end_year"),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("education_talent_profile_id_idx").on(table.talentProfileId),
    index("education_sort_order_idx").on(table.talentProfileId, table.sortOrder),
  ]
);

export type Education = typeof education.$inferSelect;
export type NewEducation = typeof education.$inferInsert;

export const DEGREE_TYPES = [
  "Certificate",
  "Associate",
  "Bachelor",
  "Master",
  "Doctorate",
  "Conservatory",
  "Workshop",
  "Masterclass",
  "Other",
] as const;
