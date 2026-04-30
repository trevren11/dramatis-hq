import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  text,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { talentProfiles } from "./talent-profiles";

export const videoCategoryEnum = pgEnum("video_category", [
  "acting",
  "singing",
  "dance",
  "instrument",
  "monologue",
  "scene",
  "other",
]);

export const videoVisibilityEnum = pgEnum("video_visibility", [
  "public",
  "producers_only",
  "private",
]);

export const videoSourceTypeEnum = pgEnum("video_source_type", ["upload", "youtube", "vimeo"]);

export const videoStatusEnum = pgEnum("video_status", ["processing", "ready", "failed"]);

export const videoSamples = pgTable(
  "video_samples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Metadata
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    category: videoCategoryEnum("category").notNull(),
    tags: varchar("tags", { length: 500 }), // Comma-separated tags
    visibility: videoVisibilityEnum("visibility").default("public").notNull(),

    // Source info
    sourceType: videoSourceTypeEnum("source_type").default("upload").notNull(),
    sourceUrl: varchar("source_url", { length: 1024 }), // Original or external URL
    processedUrl: varchar("processed_url", { length: 1024 }), // CDN URL for uploaded videos
    thumbnailUrl: varchar("thumbnail_url", { length: 1024 }),

    // File info (for uploads)
    originalFilename: varchar("original_filename", { length: 255 }),
    mimeType: varchar("mime_type", { length: 50 }),
    fileSize: integer("file_size"), // In bytes
    duration: integer("duration"), // In seconds
    width: integer("width"),
    height: integer("height"),

    // Processing status (for uploads)
    status: videoStatusEnum("status").default("processing").notNull(),
    processingError: text("processing_error"),

    // Display options
    sortOrder: integer("sort_order").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),

    // Timestamps
    uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("video_samples_talent_profile_id_idx").on(table.talentProfileId),
    index("video_samples_category_idx").on(table.category),
    index("video_samples_visibility_idx").on(table.visibility),
    index("video_samples_status_idx").on(table.status),
    index("video_samples_is_featured_idx").on(table.talentProfileId, table.isFeatured),
    index("video_samples_sort_order_idx").on(table.talentProfileId, table.sortOrder),
  ]
);

export type VideoSample = typeof videoSamples.$inferSelect;
export type NewVideoSample = typeof videoSamples.$inferInsert;

export const VIDEO_CATEGORIES = [
  "acting",
  "singing",
  "dance",
  "instrument",
  "monologue",
  "scene",
  "other",
] as const;

export const VIDEO_CATEGORY_LABELS: Record<(typeof VIDEO_CATEGORIES)[number], string> = {
  acting: "Acting",
  singing: "Singing",
  dance: "Dance",
  instrument: "Instrument",
  monologue: "Monologue",
  scene: "Scene",
  other: "Other",
};

export const VIDEO_VISIBILITIES = ["public", "producers_only", "private"] as const;

export const VIDEO_VISIBILITY_LABELS: Record<(typeof VIDEO_VISIBILITIES)[number], string> = {
  public: "Public",
  producers_only: "Producers Only",
  private: "Private",
};

export const VIDEO_SOURCE_TYPES = ["upload", "youtube", "vimeo"] as const;

export const VIDEO_STATUSES = ["processing", "ready", "failed"] as const;

export const MAX_VIDEO_SAMPLES = 20;
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_VIDEO_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
