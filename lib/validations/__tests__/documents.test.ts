import { describe, it, expect } from "vitest";
import {
  documentUploadSchema,
  documentUpdateSchema,
  producerDocumentUploadSchema,
  validateFileType,
  validateFileSize,
  getFileSizeError,
  documentTypeValues,
} from "../documents";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Document Validation", () => {
  describe("documentTypeValues", () => {
    it("exports valid document type values", () => {
      expect(documentTypeValues).toContain("W2");
      expect(documentTypeValues).toContain("1099");
      expect(documentTypeValues).toContain("I9");
      expect(documentTypeValues).toContain("Contract");
      expect(documentTypeValues).toContain("CallSheet");
      expect(documentTypeValues).toContain("Other");
    });
  });

  describe("documentUploadSchema", () => {
    it("accepts valid document upload with minimal fields", () => {
      const doc = {
        name: "Tax Document",
        documentType: "W2" as const,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("accepts valid document upload with all fields", () => {
      const doc = {
        name: "Tax Document 2023",
        documentType: "W2" as const,
        description: "My W2 form for 2023",
        taxYear: 2023,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("accepts all valid document types", () => {
      const types = ["W2", "1099", "I9", "Contract", "CallSheet", "Other"];

      for (const documentType of types) {
        const doc = { name: "Document", documentType };
        expect(documentUploadSchema.safeParse(doc).success).toBe(true);
      }
    });

    it("rejects empty name", () => {
      const doc = {
        name: "",
        documentType: "W2" as const,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects name over 255 characters", () => {
      const doc = {
        name: "a".repeat(256),
        documentType: "W2" as const,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects invalid document type", () => {
      const doc = {
        name: "Document",
        documentType: "InvalidType",
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects description over 1000 characters", () => {
      const doc = {
        name: "Document",
        documentType: "W2" as const,
        description: "a".repeat(1001),
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects tax year before 1900", () => {
      const doc = {
        name: "Document",
        documentType: "W2" as const,
        taxYear: 1899,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("accepts current year tax year", () => {
      const currentYear = new Date().getFullYear();
      const doc = {
        name: "Document",
        documentType: "W2" as const,
        taxYear: currentYear,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("accepts next year tax year", () => {
      const nextYear = new Date().getFullYear() + 1;
      const doc = {
        name: "Document",
        documentType: "W2" as const,
        taxYear: nextYear,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("rejects future year beyond next year", () => {
      const futureYear = new Date().getFullYear() + 2;
      const doc = {
        name: "Document",
        documentType: "W2" as const,
        taxYear: futureYear,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects non-integer tax year", () => {
      const doc = {
        name: "Document",
        documentType: "W2" as const,
        taxYear: 2023.5,
      };

      const result = documentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });
  });

  describe("documentUpdateSchema", () => {
    it("accepts partial updates", () => {
      const update = { name: "Updated Name" };
      expect(documentUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update object", () => {
      expect(documentUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("accepts description update", () => {
      const update = { description: "New description" };
      expect(documentUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts tax year update", () => {
      const update = { taxYear: 2022 };
      expect(documentUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("validates name when provided", () => {
      const update = { name: "" };
      expect(documentUpdateSchema.safeParse(update).success).toBe(false);
    });

    it("validates description length when provided", () => {
      const update = { description: "a".repeat(1001) };
      expect(documentUpdateSchema.safeParse(update).success).toBe(false);
    });
  });

  describe("producerDocumentUploadSchema", () => {
    it("accepts valid producer document upload", () => {
      const doc = {
        name: "Talent W2",
        documentType: "W2" as const,
        talentUserId: validUUID,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("rejects missing talentUserId", () => {
      const doc = {
        name: "Talent W2",
        documentType: "W2" as const,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects invalid talentUserId UUID", () => {
      const doc = {
        name: "Talent W2",
        documentType: "W2" as const,
        talentUserId: "not-a-uuid",
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("inherits document validation rules", () => {
      const doc = {
        name: "",
        documentType: "W2" as const,
        talentUserId: validUUID,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });
  });

  describe("validateFileType", () => {
    it("accepts PDF files", () => {
      expect(validateFileType("application/pdf")).toBe(true);
    });

    it("accepts JPEG images", () => {
      expect(validateFileType("image/jpeg")).toBe(true);
    });

    it("accepts PNG images", () => {
      expect(validateFileType("image/png")).toBe(true);
    });

    it("rejects Word documents", () => {
      expect(validateFileType("application/msword")).toBe(false);
    });

    it("rejects Excel files", () => {
      expect(validateFileType("application/vnd.ms-excel")).toBe(false);
    });

    it("rejects GIF images", () => {
      expect(validateFileType("image/gif")).toBe(false);
    });

    it("rejects plain text", () => {
      expect(validateFileType("text/plain")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateFileType("")).toBe(false);
    });
  });

  describe("validateFileSize", () => {
    it("accepts file size of 1 byte", () => {
      expect(validateFileSize(1)).toBe(true);
    });

    it("accepts file size of 25MB", () => {
      const size25MB = 25 * 1024 * 1024;
      expect(validateFileSize(size25MB)).toBe(true);
    });

    it("accepts file size under 25MB", () => {
      const size10MB = 10 * 1024 * 1024;
      expect(validateFileSize(size10MB)).toBe(true);
    });

    it("rejects file size over 25MB", () => {
      const sizeOver25MB = 25 * 1024 * 1024 + 1;
      expect(validateFileSize(sizeOver25MB)).toBe(false);
    });

    it("rejects file size of 0", () => {
      expect(validateFileSize(0)).toBe(false);
    });

    it("rejects negative file size", () => {
      expect(validateFileSize(-1)).toBe(false);
    });
  });

  describe("getFileSizeError", () => {
    it("returns error message with correct size limit", () => {
      const error = getFileSizeError();
      expect(error).toBe("File size must be 25MB or less");
    });
  });
});
