import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  index,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { shows } from "./shows";
import { producerProfiles } from "./producer-profiles";
import { talentProfiles } from "./talent-profiles";
import { documents, documentTypeEnum } from "./documents";

// Status of producer-uploaded document delivery to talent
export const producerDocumentStatusEnum = pgEnum("producer_document_status", [
  "pending", // Uploaded but not yet processed
  "delivered", // Notification sent to talent
  "viewed", // Talent has viewed the document
  "downloaded", // Talent has downloaded the document
]);

// Producer documents - tracks documents uploaded by producers for talent
// Links to the main documents table but adds show/org context and view tracking
export const producerDocuments = pgTable(
  "producer_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Link to the actual encrypted document
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),

    // Organization context
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Show context (optional - some docs may be org-wide)
    showId: uuid("show_id").references(() => shows.id, { onDelete: "set null" }),

    // Talent who receives this document
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Document type (denormalized for query efficiency)
    documentType: documentTypeEnum("document_type").notNull(),

    // Year for tax documents (W2, 1099)
    year: integer("year"),

    // Status tracking
    status: producerDocumentStatusEnum("status").default("pending").notNull(),

    // Notification tracking
    notificationSentAt: timestamp("notification_sent_at", { mode: "date" }),
    emailId: varchar("email_id", { length: 255 }), // Reference to email log

    // View tracking
    viewedAt: timestamp("viewed_at", { mode: "date" }),
    viewedByUserId: uuid("viewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    downloadedAt: timestamp("downloaded_at", { mode: "date" }),

    // Upload tracking
    uploadedBy: uuid("uploaded_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),

    // Compliance deadlines
    deadline: timestamp("deadline", { mode: "date" }),

    // Notes from producer
    notes: text("notes"),

    // Soft delete
    deletedAt: timestamp("deleted_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    // Primary lookup patterns
    index("producer_docs_org_id_idx").on(table.organizationId),
    index("producer_docs_show_id_idx").on(table.showId),
    index("producer_docs_talent_profile_id_idx").on(table.talentProfileId),
    index("producer_docs_document_id_idx").on(table.documentId),

    // Status and compliance queries
    index("producer_docs_status_idx").on(table.status),
    index("producer_docs_deadline_idx").on(table.deadline),
    index("producer_docs_doc_type_idx").on(table.documentType),

    // Compliance tracking - find missing docs by type and year
    index("producer_docs_compliance_idx").on(
      table.organizationId,
      table.documentType,
      table.year
    ),

    // Show-specific compliance
    index("producer_docs_show_compliance_idx").on(
      table.showId,
      table.documentType,
      table.year
    ),

    // View tracking queries
    index("producer_docs_viewed_at_idx").on(table.viewedAt),

    // Prevent duplicate document links
    unique("producer_docs_unique_doc_talent").on(table.documentId, table.talentProfileId),
  ]
);

// Compliance deadlines - configurable deadlines for document types
export const complianceDeadlines = pgTable(
  "compliance_deadlines",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Optional show-specific deadline
    showId: uuid("show_id").references(() => shows.id, { onDelete: "cascade" }),

    documentType: documentTypeEnum("document_type").notNull(),

    // For recurring deadlines (e.g., W2 due every year)
    year: integer("year"),

    // The deadline date
    deadline: timestamp("deadline", { mode: "date" }).notNull(),

    // Reminder settings
    reminderDays: integer("reminder_days").default(7), // Days before deadline to send reminder
    reminderSent: timestamp("reminder_sent", { mode: "date" }),

    // Description for the deadline
    description: text("description"),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("compliance_deadlines_org_id_idx").on(table.organizationId),
    index("compliance_deadlines_show_id_idx").on(table.showId),
    index("compliance_deadlines_deadline_idx").on(table.deadline),
    index("compliance_deadlines_doc_type_idx").on(table.documentType),

    // Unique deadline per org/show/type/year
    unique("compliance_deadlines_unique").on(
      table.organizationId,
      table.showId,
      table.documentType,
      table.year
    ),
  ]
);

// Type exports
export type ProducerDocument = typeof producerDocuments.$inferSelect;
export type NewProducerDocument = typeof producerDocuments.$inferInsert;
export type ComplianceDeadline = typeof complianceDeadlines.$inferSelect;
export type NewComplianceDeadline = typeof complianceDeadlines.$inferInsert;

export type ProducerDocumentStatus =
  (typeof producerDocumentStatusEnum.enumValues)[number];

// Status labels for UI
export const PRODUCER_DOCUMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", description: "Document uploaded, notification not sent" },
  { value: "delivered", label: "Delivered", description: "Notification sent to talent" },
  { value: "viewed", label: "Viewed", description: "Talent has viewed the document" },
  { value: "downloaded", label: "Downloaded", description: "Talent has downloaded the document" },
] as const;

export const PRODUCER_DOCUMENT_STATUS_VALUES = [
  "pending",
  "delivered",
  "viewed",
  "downloaded",
] as const;

// Tax document types that require year tracking
export const TAX_DOCUMENT_TYPES = ["W2", "1099"] as const;

// I-9 must be completed within 3 days of hire per law
export const I9_COMPLETION_DAYS = 3;
