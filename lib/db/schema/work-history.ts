import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { talentProfiles } from "./talent-profiles";

export const workCategoryEnum = pgEnum("work_category", [
  "theater",
  "film",
  "television",
  "commercial",
  "web_series",
  "music_video",
  "voice_over",
  "industrial",
  "live_event",
  "other",
]);

export const workHistory = pgTable(
  "work_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    showName: varchar("show_name", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }).notNull(),
    category: workCategoryEnum("category").notNull(),
    location: varchar("location", { length: 200 }),
    director: varchar("director", { length: 200 }),
    productionCompany: varchar("production_company", { length: 200 }),
    startDate: timestamp("start_date", { mode: "date" }),
    endDate: timestamp("end_date", { mode: "date" }),
    isUnion: boolean("is_union").default(false),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("work_history_talent_profile_id_idx").on(table.talentProfileId),
    index("work_history_sort_order_idx").on(table.talentProfileId, table.sortOrder),
  ]
);

export type WorkHistory = typeof workHistory.$inferSelect;
export type NewWorkHistory = typeof workHistory.$inferInsert;

export const WORK_CATEGORIES = [
  "theater",
  "film",
  "television",
  "commercial",
  "web_series",
  "music_video",
  "voice_over",
  "industrial",
  "live_event",
  "other",
] as const;

export const WORK_CATEGORY_LABELS: Record<(typeof WORK_CATEGORIES)[number], string> = {
  theater: "Theater",
  film: "Film",
  television: "Television",
  commercial: "Commercial",
  web_series: "Web Series",
  music_video: "Music Video",
  voice_over: "Voice Over",
  industrial: "Industrial",
  live_event: "Live Event",
  other: "Other",
};
