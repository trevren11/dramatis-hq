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
import { users } from "./users";

// Enums
export const materialTypeEnum = pgEnum("material_type", ["script", "track"]);

export const grantTypeEnum = pgEnum("grant_type", ["user", "role", "all_cast"]);

export const materialAccessActionEnum = pgEnum("material_access_action_type", [
  "view",
  "download",
  "stream",
]);

// Scripts table
export const scripts = pgTable(
  "scripts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),

    // Version info
    version: integer("version").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    // File info
    filename: varchar("filename", { length: 255 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    s3Key: varchar("s3_key", { length: 500 }).notNull().unique(),

    // Script metadata
    title: varchar("title", { length: 255 }),
    revisionNotes: text("revision_notes"),

    // Upload info
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("scripts_show_id_idx").on(table.showId),
    index("scripts_version_idx").on(table.showId, table.version),
    index("scripts_is_active_idx").on(table.showId, table.isActive),
    index("scripts_uploaded_at_idx").on(table.uploadedAt),
  ]
);

// Minus tracks table
export const minusTracks = pgTable(
  "minus_tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),

    // Track metadata
    title: varchar("title", { length: 255 }).notNull(),
    act: varchar("act", { length: 50 }),
    scene: varchar("scene", { length: 50 }),
    trackNumber: integer("track_number"),
    originalKey: varchar("original_key", { length: 20 }),
    tempo: integer("tempo"),
    notes: text("notes"),

    // File info
    filename: varchar("filename", { length: 255 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    s3Key: varchar("s3_key", { length: 500 }).notNull().unique(),
    duration: integer("duration"), // Duration in seconds

    // Ordering
    sortOrder: integer("sort_order").default(0).notNull(),

    // Upload info
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("minus_tracks_show_id_idx").on(table.showId),
    index("minus_tracks_act_scene_idx").on(table.showId, table.act, table.scene),
    index("minus_tracks_sort_order_idx").on(table.showId, table.sortOrder),
    index("minus_tracks_uploaded_at_idx").on(table.uploadedAt),
  ]
);

// Material permissions table
export const materialPermissions = pgTable(
  "material_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // What material is being shared
    materialType: materialTypeEnum("material_type").notNull(),
    materialId: uuid("material_id").notNull(), // References scripts.id or minusTracks.id

    // Who it's shared with
    grantType: grantTypeEnum("grant_type").notNull(),
    grantedToUserId: uuid("granted_to_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    grantedToRoleId: uuid("granted_to_role_id").references(() => roles.id, {
      onDelete: "cascade",
    }),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(), // For all_cast grant type and indexing

    // Permissions
    canDownload: boolean("can_download").default(false).notNull(),
    canView: boolean("can_view").default(true).notNull(),

    // Time-limited access
    expiresAt: timestamp("expires_at", { mode: "date" }),

    // Who granted access
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
    grantedAt: timestamp("granted_at", { mode: "date" }).defaultNow().notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("material_permissions_material_idx").on(table.materialType, table.materialId),
    index("material_permissions_user_idx").on(table.grantedToUserId),
    index("material_permissions_role_idx").on(table.grantedToRoleId),
    index("material_permissions_show_idx").on(table.showId),
    index("material_permissions_expires_at_idx").on(table.expiresAt),
    // Ensure unique permissions per material-user/role combination
    unique("material_permissions_unique_user").on(
      table.materialType,
      table.materialId,
      table.grantedToUserId
    ),
    unique("material_permissions_unique_role").on(
      table.materialType,
      table.materialId,
      table.grantedToRoleId
    ),
  ]
);

// Material access logs for audit trail
export const materialAccessLogs = pgTable(
  "material_access_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // What was accessed
    materialType: materialTypeEnum("material_type").notNull(),
    materialId: uuid("material_id").notNull(),

    // Who accessed it
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    // Access details
    action: materialAccessActionEnum("action").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    // Timestamp
    timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("material_access_logs_material_idx").on(table.materialType, table.materialId),
    index("material_access_logs_user_idx").on(table.userId),
    index("material_access_logs_timestamp_idx").on(table.timestamp),
    index("material_access_logs_action_idx").on(table.action),
  ]
);

// Types
export type Script = typeof scripts.$inferSelect;
export type NewScript = typeof scripts.$inferInsert;
export type MinusTrack = typeof minusTracks.$inferSelect;
export type NewMinusTrack = typeof minusTracks.$inferInsert;
export type MaterialPermission = typeof materialPermissions.$inferSelect;
export type NewMaterialPermission = typeof materialPermissions.$inferInsert;
export type MaterialAccessLog = typeof materialAccessLogs.$inferSelect;
export type NewMaterialAccessLog = typeof materialAccessLogs.$inferInsert;

export type MaterialType = (typeof materialTypeEnum.enumValues)[number];
export type GrantType = (typeof grantTypeEnum.enumValues)[number];
export type MaterialAccessAction = (typeof materialAccessActionEnum.enumValues)[number];

// Constants
export const ALLOWED_SCRIPT_TYPES = ["application/pdf"] as const;
export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
] as const;

export const MAX_SCRIPT_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB

export const MATERIAL_TYPE_OPTIONS = [
  { value: "script", label: "Script" },
  { value: "track", label: "Minus Track" },
] as const;

export const GRANT_TYPE_OPTIONS = [
  { value: "user", label: "Specific User" },
  { value: "role", label: "Role/Character" },
  { value: "all_cast", label: "All Cast" },
] as const;

export const MUSICAL_KEYS = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
  "Cm",
  "C#m/Dbm",
  "Dm",
  "D#m/Ebm",
  "Em",
  "Fm",
  "F#m/Gbm",
  "Gm",
  "G#m/Abm",
  "Am",
  "A#m/Bbm",
  "Bm",
] as const;

export const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
] as const;

export const KEY_ADJUSTMENT_OPTIONS = [
  { value: -6, label: "-6 semitones" },
  { value: -5, label: "-5 semitones" },
  { value: -4, label: "-4 semitones" },
  { value: -3, label: "-3 semitones" },
  { value: -2, label: "-2 semitones" },
  { value: -1, label: "-1 semitone" },
  { value: 0, label: "Original key" },
  { value: 1, label: "+1 semitone" },
  { value: 2, label: "+2 semitones" },
  { value: 3, label: "+3 semitones" },
  { value: 4, label: "+4 semitones" },
  { value: 5, label: "+5 semitones" },
  { value: 6, label: "+6 semitones" },
] as const;
