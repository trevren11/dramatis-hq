import { describe, it, expect } from "vitest";
import {
  producerDocumentUploadSchema,
  bulkProducerDocumentUploadSchema,
  producerDocumentUpdateSchema,
  producerDocumentListSchema,
  complianceReportSchema,
  complianceDeadlineSchema,
  validateFileType,
  validateFileSize,
  getFileSizeError,
  documentTypeValues,
} from "../producer-documents";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "660e8400-e29b-41d4-a716-446655440001";

describe("Producer Document Validation", () => {
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

  describe("producerDocumentUploadSchema", () => {
    it("accepts valid document upload with minimal fields", () => {
      const doc = {
        name: "W2 Document",
        documentType: "Other" as const,
        talentUserId: validUUID,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("accepts valid document upload with all fields", () => {
      const doc = {
        name: "W2 Document 2024",
        documentType: "W2" as const,
        description: "Annual tax document",
        talentUserId: validUUID,
        showId: validUUID2,
        year: 2024,
        deadline: new Date("2024-04-15"),
        notes: "Please submit by tax deadline",
        sendNotification: true,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("requires year for tax documents (W2)", () => {
      const doc = {
        name: "W2 Document",
        documentType: "W2" as const,
        talentUserId: validUUID,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("year");
      }
    });

    it("requires year for tax documents (1099)", () => {
      const doc = {
        name: "1099 Document",
        documentType: "1099" as const,
        talentUserId: validUUID,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("does not require year for non-tax documents", () => {
      const doc = {
        name: "Contract",
        documentType: "Contract" as const,
        talentUserId: validUUID,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it("defaults sendNotification to true", () => {
      const doc = {
        name: "Contract",
        documentType: "Contract" as const,
        talentUserId: validUUID,
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sendNotification).toBe(true);
      }
    });

    it("rejects invalid talentUserId", () => {
      const doc = {
        name: "Document",
        documentType: "Other" as const,
        talentUserId: "not-a-uuid",
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects invalid showId", () => {
      const doc = {
        name: "Document",
        documentType: "Other" as const,
        talentUserId: validUUID,
        showId: "not-a-uuid",
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it("rejects notes over 2000 characters", () => {
      const doc = {
        name: "Document",
        documentType: "Other" as const,
        talentUserId: validUUID,
        notes: "a".repeat(2001),
      };

      const result = producerDocumentUploadSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkProducerDocumentUploadSchema", () => {
    it("accepts valid bulk upload", () => {
      const data = {
        documentType: "W2" as const,
        year: 2024,
        sendNotification: true,
        uploads: [
          { talentUserId: validUUID, name: "Doc 1" },
          { talentUserId: validUUID2, name: "Doc 2" },
        ],
      };

      const result = bulkProducerDocumentUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("requires at least one upload", () => {
      const data = {
        documentType: "W2" as const,
        uploads: [],
      };

      const result = bulkProducerDocumentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("validates each upload entry", () => {
      const data = {
        documentType: "W2" as const,
        uploads: [{ talentUserId: "invalid-uuid" }],
      };

      const result = bulkProducerDocumentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("allows optional showId", () => {
      const data = {
        documentType: "Contract" as const,
        showId: validUUID,
        uploads: [{ talentUserId: validUUID }],
      };

      const result = bulkProducerDocumentUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("producerDocumentUpdateSchema", () => {
    it("accepts notes update", () => {
      const update = { notes: "Updated notes" };
      expect(producerDocumentUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts deadline update", () => {
      const update = { deadline: new Date("2024-12-31") };
      expect(producerDocumentUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts null values to clear fields", () => {
      const update = { notes: null, deadline: null };
      expect(producerDocumentUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty object", () => {
      expect(producerDocumentUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects notes over 2000 characters", () => {
      const update = { notes: "a".repeat(2001) };
      expect(producerDocumentUpdateSchema.safeParse(update).success).toBe(false);
    });
  });

  describe("producerDocumentListSchema", () => {
    it("accepts valid filters", () => {
      const filters = {
        showId: validUUID,
        talentProfileId: validUUID,
        documentType: "W2" as const,
        status: "delivered" as const,
        year: 2024,
        page: 1,
        limit: 20,
      };

      const result = producerDocumentListSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it("provides defaults for pagination", () => {
      const filters = {};
      const result = producerDocumentListSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("coerces string year to number", () => {
      const filters = { year: "2024" };
      const result = producerDocumentListSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2024);
      }
    });

    it("limits max limit to 100", () => {
      const filters = { limit: 500 };
      const result = producerDocumentListSchema.safeParse(filters);
      expect(result.success).toBe(false);
    });
  });

  describe("complianceReportSchema", () => {
    it("accepts valid filters", () => {
      const filters = {
        showId: validUUID,
        documentType: "W2" as const,
        year: 2024,
        status: "missing" as const,
      };

      const result = complianceReportSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it("accepts empty filters", () => {
      expect(complianceReportSchema.safeParse({}).success).toBe(true);
    });

    it("accepts all valid status values", () => {
      const statuses = ["missing", "pending", "overdue", "complete"];
      for (const status of statuses) {
        const result = complianceReportSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const filters = { status: "invalid" };
      const result = complianceReportSchema.safeParse(filters);
      expect(result.success).toBe(false);
    });
  });

  describe("complianceDeadlineSchema", () => {
    it("accepts valid deadline", () => {
      const deadline = {
        documentType: "W2" as const,
        deadline: new Date("2024-04-15"),
      };

      const result = complianceDeadlineSchema.safeParse(deadline);
      expect(result.success).toBe(true);
    });

    it("accepts deadline with all fields", () => {
      const deadline = {
        showId: validUUID,
        documentType: "I9" as const,
        year: 2024,
        deadline: new Date("2024-01-15"),
        reminderDays: 14,
        description: "I-9 must be completed within 3 days of start",
      };

      const result = complianceDeadlineSchema.safeParse(deadline);
      expect(result.success).toBe(true);
    });

    it("defaults reminderDays to 7", () => {
      const deadline = {
        documentType: "W2" as const,
        deadline: new Date("2024-04-15"),
      };

      const result = complianceDeadlineSchema.safeParse(deadline);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reminderDays).toBe(7);
      }
    });

    it("requires deadline date", () => {
      const deadline = {
        documentType: "W2" as const,
      };

      const result = complianceDeadlineSchema.safeParse(deadline);
      expect(result.success).toBe(false);
    });

    it("rejects reminderDays over 90", () => {
      const deadline = {
        documentType: "W2" as const,
        deadline: new Date("2024-04-15"),
        reminderDays: 100,
      };

      const result = complianceDeadlineSchema.safeParse(deadline);
      expect(result.success).toBe(false);
    });

    it("rejects negative reminderDays", () => {
      const deadline = {
        documentType: "W2" as const,
        deadline: new Date("2024-04-15"),
        reminderDays: -1,
      };

      const result = complianceDeadlineSchema.safeParse(deadline);
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

    it("rejects executable files", () => {
      expect(validateFileType("application/x-executable")).toBe(false);
    });
  });

  describe("validateFileSize", () => {
    it("accepts valid file sizes", () => {
      expect(validateFileSize(1024)).toBe(true);
      expect(validateFileSize(1024 * 1024)).toBe(true);
      expect(validateFileSize(25 * 1024 * 1024)).toBe(true);
    });

    it("rejects files over 25MB", () => {
      expect(validateFileSize(25 * 1024 * 1024 + 1)).toBe(false);
    });

    it("rejects zero-size files", () => {
      expect(validateFileSize(0)).toBe(false);
    });
  });

  describe("getFileSizeError", () => {
    it("returns human-readable error message", () => {
      expect(getFileSizeError()).toBe("File size must be 25MB or less");
    });
  });
});
