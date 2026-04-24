import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  text,
  index,
} from "drizzle-orm/pg-core";
import { producerProfiles } from "./producer-profiles";

export const productionPhotos = pgTable(
  "production_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    producerProfileId: uuid("producer_profile_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    originalFilename: varchar("original_filename", { length: 255 }),
    mimeType: varchar("mime_type", { length: 50 }),
    fileSize: integer("file_size"),
    width: integer("width"),
    height: integer("height"),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    productionName: varchar("production_name", { length: 255 }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_photos_producer_profile_id_idx").on(table.producerProfileId),
    index("production_photos_is_featured_idx").on(table.producerProfileId, table.isFeatured),
    index("production_photos_sort_order_idx").on(table.producerProfileId, table.sortOrder),
  ]
);

export type ProductionPhoto = typeof productionPhotos.$inferSelect;
export type NewProductionPhoto = typeof productionPhotos.$inferInsert;

export const MAX_PRODUCTION_PHOTOS = 20;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
