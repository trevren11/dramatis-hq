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
  jsonb,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { users } from "./users";

export const departmentTypeEnum = pgEnum("department_type", [
  "lighting",
  "director",
  "makeup_hair",
  "costuming",
  "scenic",
  "dramaturg",
  "ad_notes",
  "props",
  "choreographer",
  "sound",
  "stage_management",
  "custom",
]);

export const noteAccessLevelEnum = pgEnum("note_access_level", [
  "department_head",
  "department_member",
  "director",
  "all_crew",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "note_created",
  "note_updated",
  "note_deleted",
  "file_uploaded",
  "file_deleted",
  "comment_added",
  "comment_deleted",
  "folder_created",
  "folder_deleted",
  "mention",
]);

export const productionDepartments = pgTable(
  "production_departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    type: departmentTypeEnum("type").default("custom").notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }),
    icon: varchar("icon", { length: 50 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    headUserId: uuid("head_user_id").references(() => users.id, { onDelete: "set null" }),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_departments_show_id_idx").on(table.showId),
    index("production_departments_type_idx").on(table.type),
    index("production_departments_head_user_id_idx").on(table.headUserId),
    unique("production_departments_unique_show_type").on(table.showId, table.type),
  ]
);

export const productionFolders = pgTable(
  "production_folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .references(() => productionDepartments.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    parentFolderId: uuid("parent_folder_id"),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_folders_department_id_idx").on(table.departmentId),
    index("production_folders_parent_folder_id_idx").on(table.parentFolderId),
  ]
);

export const productionNotes = pgTable(
  "production_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .references(() => productionDepartments.id, { onDelete: "cascade" })
      .notNull(),
    folderId: uuid("folder_id").references(() => productionFolders.id, { onDelete: "set null" }),

    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    templateType: varchar("template_type", { length: 50 }),

    version: integer("version").default(1).notNull(),
    isDraft: boolean("is_draft").default(false).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),

    accessLevel: noteAccessLevelEnum("access_level").default("department_member").notNull(),

    lastEditedBy: uuid("last_edited_by").references(() => users.id, { onDelete: "set null" }),
    lastEditedAt: timestamp("last_edited_at", { mode: "date" }),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_notes_department_id_idx").on(table.departmentId),
    index("production_notes_folder_id_idx").on(table.folderId),
    index("production_notes_is_pinned_idx").on(table.isPinned),
    index("production_notes_created_at_idx").on(table.createdAt),
    index("production_notes_last_edited_at_idx").on(table.lastEditedAt),
  ]
);

export const productionNoteVersions = pgTable(
  "production_note_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    noteId: uuid("note_id")
      .references(() => productionNotes.id, { onDelete: "cascade" })
      .notNull(),

    version: integer("version").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    changesSummary: text("changes_summary"),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_note_versions_note_id_idx").on(table.noteId),
    index("production_note_versions_version_idx").on(table.noteId, table.version),
  ]
);

export const productionFiles = pgTable(
  "production_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .references(() => productionDepartments.id, { onDelete: "cascade" })
      .notNull(),
    folderId: uuid("folder_id").references(() => productionFolders.id, { onDelete: "set null" }),
    noteId: uuid("note_id").references(() => productionNotes.id, { onDelete: "set null" }),

    name: varchar("name", { length: 255 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    s3Key: varchar("s3_key", { length: 500 }).notNull().unique(),

    thumbnailS3Key: varchar("thumbnail_s3_key", { length: 500 }),
    isImage: boolean("is_image").default(false).notNull(),
    isPdf: boolean("is_pdf").default(false).notNull(),

    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_files_department_id_idx").on(table.departmentId),
    index("production_files_folder_id_idx").on(table.folderId),
    index("production_files_note_id_idx").on(table.noteId),
    index("production_files_mime_type_idx").on(table.mimeType),
    index("production_files_created_at_idx").on(table.createdAt),
  ]
);

export const productionNoteComments = pgTable(
  "production_note_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    noteId: uuid("note_id")
      .references(() => productionNotes.id, { onDelete: "cascade" })
      .notNull(),
    parentCommentId: uuid("parent_comment_id"),

    content: text("content").notNull(),
    mentions: jsonb("mentions").$type<string[]>().default([]),

    isResolved: boolean("is_resolved").default(false).notNull(),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),

    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_note_comments_note_id_idx").on(table.noteId),
    index("production_note_comments_parent_comment_id_idx").on(table.parentCommentId),
    index("production_note_comments_created_by_idx").on(table.createdBy),
    index("production_note_comments_is_resolved_idx").on(table.isResolved),
  ]
);

export const productionActivity = pgTable(
  "production_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    departmentId: uuid("department_id").references(() => productionDepartments.id, {
      onDelete: "cascade",
    }),

    activityType: activityTypeEnum("activity_type").notNull(),
    entityId: uuid("entity_id"),
    entityType: varchar("entity_type", { length: 50 }),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("production_activity_show_id_idx").on(table.showId),
    index("production_activity_department_id_idx").on(table.departmentId),
    index("production_activity_user_id_idx").on(table.userId),
    index("production_activity_activity_type_idx").on(table.activityType),
    index("production_activity_created_at_idx").on(table.createdAt),
  ]
);

export const departmentMembers = pgTable(
  "department_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .references(() => productionDepartments.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    role: varchar("role", { length: 100 }),
    canEdit: boolean("can_edit").default(false).notNull(),
    canDelete: boolean("can_delete").default(false).notNull(),
    canManageFiles: boolean("can_manage_files").default(false).notNull(),

    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("department_members_department_id_idx").on(table.departmentId),
    index("department_members_user_id_idx").on(table.userId),
    unique("department_members_unique_user_department").on(table.departmentId, table.userId),
  ]
);

export const noteTemplates = pgTable(
  "note_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    departmentType: departmentTypeEnum("department_type"),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    content: text("content").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("note_templates_show_id_idx").on(table.showId),
    index("note_templates_department_type_idx").on(table.departmentType),
    index("note_templates_is_default_idx").on(table.isDefault),
  ]
);

export type ProductionDepartment = typeof productionDepartments.$inferSelect;
export type NewProductionDepartment = typeof productionDepartments.$inferInsert;
export type ProductionFolder = typeof productionFolders.$inferSelect;
export type NewProductionFolder = typeof productionFolders.$inferInsert;
export type ProductionNote = typeof productionNotes.$inferSelect;
export type NewProductionNote = typeof productionNotes.$inferInsert;
export type ProductionNoteVersion = typeof productionNoteVersions.$inferSelect;
export type NewProductionNoteVersion = typeof productionNoteVersions.$inferInsert;
export type ProductionFile = typeof productionFiles.$inferSelect;
export type NewProductionFile = typeof productionFiles.$inferInsert;
export type ProductionNoteComment = typeof productionNoteComments.$inferSelect;
export type NewProductionNoteComment = typeof productionNoteComments.$inferInsert;
export type ProductionActivityRecord = typeof productionActivity.$inferSelect;
export type NewProductionActivityRecord = typeof productionActivity.$inferInsert;
export type DepartmentMember = typeof departmentMembers.$inferSelect;
export type NewDepartmentMember = typeof departmentMembers.$inferInsert;
export type NoteTemplate = typeof noteTemplates.$inferSelect;
export type NewNoteTemplate = typeof noteTemplates.$inferInsert;

export type DepartmentType = (typeof departmentTypeEnum.enumValues)[number];
export type NoteAccessLevel = (typeof noteAccessLevelEnum.enumValues)[number];
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];

export const DEPARTMENT_TYPE_OPTIONS = [
  { value: "lighting", label: "Lighting", icon: "Lightbulb", color: "#fbbf24" },
  { value: "director", label: "Director's Vision", icon: "Video", color: "#ef4444" },
  { value: "makeup_hair", label: "Makeup/Hair", icon: "Sparkles", color: "#ec4899" },
  { value: "costuming", label: "Costuming", icon: "Shirt", color: "#8b5cf6" },
  { value: "scenic", label: "Scenic", icon: "Mountain", color: "#22c55e" },
  { value: "dramaturg", label: "Dramaturg", icon: "BookOpen", color: "#3b82f6" },
  { value: "ad_notes", label: "AD Notes", icon: "ClipboardList", color: "#f97316" },
  { value: "props", label: "Props", icon: "Package", color: "#14b8a6" },
  { value: "choreographer", label: "Choreographer", icon: "Music", color: "#a855f7" },
  { value: "sound", label: "Sound", icon: "Volume2", color: "#06b6d4" },
  { value: "stage_management", label: "Stage Management", icon: "Users", color: "#64748b" },
  { value: "custom", label: "Custom", icon: "Folder", color: "#6b7280" },
] as const;

export const DEPARTMENT_TYPE_VALUES = [
  "lighting",
  "director",
  "makeup_hair",
  "costuming",
  "scenic",
  "dramaturg",
  "ad_notes",
  "props",
  "choreographer",
  "sound",
  "stage_management",
  "custom",
] as const;

export const NOTE_ACCESS_LEVEL_OPTIONS = [
  { value: "department_head", label: "Department Head Only" },
  { value: "department_member", label: "Department Members" },
  { value: "director", label: "Director & Department" },
  { value: "all_crew", label: "All Crew" },
] as const;

export const NOTE_ACCESS_LEVEL_VALUES = [
  "department_head",
  "department_member",
  "director",
  "all_crew",
] as const;

export const ACTIVITY_TYPE_VALUES = [
  "note_created",
  "note_updated",
  "note_deleted",
  "file_uploaded",
  "file_deleted",
  "comment_added",
  "comment_deleted",
  "folder_created",
  "folder_deleted",
  "mention",
] as const;

export const DEFAULT_DEPARTMENT_TEMPLATES = {
  lighting: {
    name: "Light Plot Template",
    content: `<h2>Light Plot</h2>
<h3>General Information</h3>
<p><strong>Designer:</strong> [Name]</p>
<p><strong>Date:</strong> [Date]</p>

<h3>Instrument Schedule</h3>
<table>
<tr><th>Position</th><th>Unit #</th><th>Type</th><th>Wattage</th><th>Color</th><th>Focus</th><th>Channel</th></tr>
<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Cue Synopsis</h3>
<table>
<tr><th>Cue</th><th>Page</th><th>Description</th><th>Time</th></tr>
<tr><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Notes</h3>
<p></p>`,
  },
  costuming: {
    name: "Costume Plot Template",
    content: `<h2>Costume Plot</h2>
<h3>Show Information</h3>
<p><strong>Designer:</strong> [Name]</p>
<p><strong>Date:</strong> [Date]</p>

<h3>Character Breakdown</h3>
<table>
<tr><th>Character</th><th>Actor</th><th>Scene</th><th>Costume Description</th><th>Quick Change</th></tr>
<tr><td></td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Measurements</h3>
<p></p>

<h3>Notes</h3>
<p></p>`,
  },
  props: {
    name: "Props List Template",
    content: `<h2>Props List</h2>
<h3>Show Information</h3>
<p><strong>Props Master:</strong> [Name]</p>
<p><strong>Date:</strong> [Date]</p>

<h3>Props by Scene</h3>
<table>
<tr><th>Scene</th><th>Prop</th><th>Description</th><th>Preset Location</th><th>Handled By</th><th>Status</th></tr>
<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Running Props</h3>
<p></p>

<h3>Notes</h3>
<p></p>`,
  },
  scenic: {
    name: "Scenic Design Template",
    content: `<h2>Scenic Design Notes</h2>
<h3>Design Concept</h3>
<p></p>

<h3>Set Pieces</h3>
<table>
<tr><th>Piece</th><th>Dimensions</th><th>Materials</th><th>Notes</th></tr>
<tr><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Scene Breakdown</h3>
<p></p>

<h3>Technical Requirements</h3>
<p></p>`,
  },
  sound: {
    name: "Sound Design Template",
    content: `<h2>Sound Design</h2>
<h3>Designer Information</h3>
<p><strong>Sound Designer:</strong> [Name]</p>
<p><strong>Date:</strong> [Date]</p>

<h3>Equipment List</h3>
<table>
<tr><th>Item</th><th>Quantity</th><th>Location</th><th>Notes</th></tr>
<tr><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Cue List</h3>
<table>
<tr><th>Cue</th><th>Page</th><th>Description</th><th>Level</th><th>Fade</th></tr>
<tr><td></td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Notes</h3>
<p></p>`,
  },
} as const;

export const ALLOWED_PRODUCTION_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const MAX_PRODUCTION_FILE_SIZE = 50 * 1024 * 1024; // 50MB
