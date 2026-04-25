import { z } from "zod";
import {
  documentTypeEnum,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
} from "@/lib/db/schema/documents";
import { producerDocumentStatusEnum, TAX_DOCUMENT_TYPES } from "@/lib/db/schema/producer-documents";

export const documentTypeValues = documentTypeEnum.enumValues;
export const statusValues = producerDocumentStatusEnum.enumValues;

// Schema for uploading a single document for a talent
export const producerDocumentUploadSchema = z
  .object({
    name: z
      .string()
      .min(1, "Document name is required")
      .max(255, "Document name must be 255 characters or less"),
    documentType: z.enum(documentTypeValues, {
      errorMap: () => ({ message: "Invalid document type" }),
    }),
    description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
    talentUserId: z.string().uuid("Invalid talent user ID"),
    showId: z.string().uuid("Invalid show ID").optional(),
    year: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .optional(),
    deadline: z.coerce.date().optional(),
    notes: z.string().max(2000, "Notes must be 2000 characters or less").optional(),
    sendNotification: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Year is required for tax documents
      if (TAX_DOCUMENT_TYPES.includes(data.documentType as (typeof TAX_DOCUMENT_TYPES)[number])) {
        return data.year !== undefined;
      }
      return true;
    },
    {
      message: "Year is required for tax documents (W2, 1099)",
      path: ["year"],
    }
  );

// Schema for bulk upload - multiple files for multiple talents
export const bulkProducerDocumentUploadSchema = z.object({
  showId: z.string().uuid("Invalid show ID").optional(),
  documentType: z.enum(documentTypeValues, {
    errorMap: () => ({ message: "Invalid document type" }),
  }),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  deadline: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  sendNotification: z.boolean().default(true),
  // Each item maps a file to a talent
  uploads: z
    .array(
      z.object({
        talentUserId: z.string().uuid("Invalid talent user ID"),
        name: z.string().min(1).max(255).optional(), // Defaults to filename
      })
    )
    .min(1, "At least one upload is required"),
});

// Schema for updating a producer document
export const producerDocumentUpdateSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
});

// Schema for listing producer documents with filters
export const producerDocumentListSchema = z.object({
  showId: z.string().uuid().optional(),
  talentProfileId: z.string().uuid().optional(),
  documentType: z.enum(documentTypeValues).optional(),
  status: z.enum(statusValues).optional(),
  year: z.coerce.number().int().min(1900).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Schema for compliance report query
export const complianceReportSchema = z.object({
  showId: z.string().uuid().optional(),
  documentType: z.enum(documentTypeValues).optional(),
  year: z.coerce.number().int().min(1900).optional(),
  status: z.enum(["missing", "pending", "overdue", "complete"]).optional(),
});

// Schema for compliance deadline
export const complianceDeadlineSchema = z.object({
  showId: z.string().uuid().optional(),
  documentType: z.enum(documentTypeValues, {
    errorMap: () => ({ message: "Invalid document type" }),
  }),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  deadline: z.coerce.date(),
  reminderDays: z.number().int().min(0).max(90).default(7),
  description: z.string().max(500).optional(),
});

// Validation helpers
export function validateFileType(mimeType: string): boolean {
  return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(mimeType);
}

export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_DOCUMENT_SIZE;
}

export function getFileSizeError(): string {
  const maxMB = MAX_DOCUMENT_SIZE / (1024 * 1024);
  return `File size must be ${String(maxMB)}MB or less`;
}

// Type exports
export type ProducerDocumentUploadInput = z.infer<typeof producerDocumentUploadSchema>;
export type BulkProducerDocumentUploadInput = z.infer<typeof bulkProducerDocumentUploadSchema>;
export type ProducerDocumentUpdateInput = z.infer<typeof producerDocumentUpdateSchema>;
export type ProducerDocumentListInput = z.infer<typeof producerDocumentListSchema>;
export type ComplianceReportInput = z.infer<typeof complianceReportSchema>;
export type ComplianceDeadlineInput = z.infer<typeof complianceDeadlineSchema>;
