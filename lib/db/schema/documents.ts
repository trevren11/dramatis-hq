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
import { users } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "W2",
  "1099",
  "I9",
  "Contract",
  "CallSheet",
  "Other",
]);

export const documentAccessActionEnum = pgEnum("document_access_action", [
  "upload",
  "view",
  "download",
  "delete",
]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Owner of the document (the talent)
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    // Who uploaded the document (could be talent or producer)
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    documentType: documentTypeEnum("document_type").notNull(),
    // Display name for the document
    name: varchar("name", { length: 255 }).notNull(),
    // Original filename
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    // MIME type
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    // File size in bytes
    fileSize: integer("file_size").notNull(),
    // S3 key for the encrypted file
    s3Key: varchar("s3_key", { length: 500 }).notNull().unique(),
    // Encryption salt (unique per document)
    encryptionSalt: varchar("encryption_salt", { length: 64 }).notNull(),
    // Encryption IV (initialization vector)
    encryptionIv: varchar("encryption_iv", { length: 48 }).notNull(),
    // Encryption auth tag for GCM mode
    encryptionAuthTag: varchar("encryption_auth_tag", { length: 48 }).notNull(),
    // Whether the document was uploaded by a producer (affects deletion permissions)
    isProducerUploaded: boolean("is_producer_uploaded").default(false).notNull(),
    // Optional description/notes
    description: text("description"),
    // Year for tax documents
    taxYear: integer("tax_year"),
    // Soft delete
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("documents_owner_id_idx").on(table.ownerId),
    index("documents_uploaded_by_id_idx").on(table.uploadedById),
    index("documents_document_type_idx").on(table.ownerId, table.documentType),
    index("documents_created_at_idx").on(table.ownerId, table.createdAt),
    index("documents_deleted_at_idx").on(table.deletedAt),
  ]
);

export const documentAccessLogs = pgTable(
  "document_access_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    // User who performed the action
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: documentAccessActionEnum("action").notNull(),
    // IP address for audit trail
    ipAddress: varchar("ip_address", { length: 45 }),
    // User agent for audit trail
    userAgent: text("user_agent"),
    // Additional metadata (JSON)
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("document_access_logs_document_id_idx").on(table.documentId),
    index("document_access_logs_user_id_idx").on(table.userId),
    index("document_access_logs_action_idx").on(table.documentId, table.action),
    index("document_access_logs_created_at_idx").on(table.createdAt),
  ]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentAccessLog = typeof documentAccessLogs.$inferSelect;
export type NewDocumentAccessLog = typeof documentAccessLogs.$inferInsert;

export type DocumentType = (typeof documentTypeEnum.enumValues)[number];
export type DocumentAccessAction = (typeof documentAccessActionEnum.enumValues)[number];

// Constants
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  W2: "W-2 Form",
  "1099": "1099 Form",
  I9: "I-9 Form",
  Contract: "Contract",
  CallSheet: "Call Sheet",
  Other: "Other Document",
};
