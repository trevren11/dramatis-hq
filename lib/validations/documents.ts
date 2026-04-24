import { z } from "zod";
import {
  documentTypeEnum,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
} from "@/lib/db/schema/documents";

export const documentTypeValues = documentTypeEnum.enumValues;

export const documentUploadSchema = z.object({
  name: z
    .string()
    .min(1, "Document name is required")
    .max(255, "Document name must be 255 characters or less"),
  documentType: z.enum(documentTypeValues, {
    errorMap: () => ({ message: "Invalid document type" }),
  }),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
  taxYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
});

export const documentUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  taxYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
});

export const producerDocumentUploadSchema = documentUploadSchema.extend({
  talentUserId: z.string().uuid("Invalid talent user ID"),
});

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

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type ProducerDocumentUploadInput = z.infer<typeof producerDocumentUploadSchema>;
