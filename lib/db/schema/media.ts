import { pgTable, uuid, varchar, timestamp, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const mediaTypeEnum = pgEnum("media_type", ["headshot", "video", "document"]);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: mediaTypeEnum("type").notNull(),
    url: varchar("url", { length: 1024 }).notNull(),
    key: varchar("key", { length: 512 }).notNull(),
    bucket: varchar("bucket", { length: 255 }).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 127 }).notNull(),
    size: varchar("size", { length: 20 }).notNull(), // Store as string to avoid integer overflow
    metadata: jsonb("metadata").$type<MediaMetadata>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (table) => [
    index("media_user_id_idx").on(table.userId),
    index("media_type_idx").on(table.type),
    index("media_key_idx").on(table.key),
  ]
);

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // For videos, in seconds
  thumbnailKey?: string;
  originalFilename?: string;
  processingStatus?: "pending" | "processing" | "completed" | "failed";
}

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
