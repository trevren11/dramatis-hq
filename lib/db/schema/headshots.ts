import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { talentProfiles } from "./talent-profiles";

export const headshots = pgTable(
  "headshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    originalFilename: varchar("original_filename", { length: 255 }),
    mimeType: varchar("mime_type", { length: 50 }),
    fileSize: integer("file_size"),
    width: integer("width"),
    height: integer("height"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("headshots_talent_profile_id_idx").on(table.talentProfileId),
    index("headshots_is_primary_idx").on(table.talentProfileId, table.isPrimary),
    index("headshots_sort_order_idx").on(table.talentProfileId, table.sortOrder),
  ]
);

export type Headshot = typeof headshots.$inferSelect;
export type NewHeadshot = typeof headshots.$inferInsert;

export const MAX_HEADSHOTS = 10;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
