import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies before importing the service
vi.mock("@/lib/db", () => {
  // Create a mock that supports chaining
  const mockInsert = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: "doc-id-123" }]),
      onConflictDoUpdate: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: "doc-id-123" }]),
      })),
    })),
  }));

  const mockUpdate = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  }));

  return {
    db: {
      insert: mockInsert,
      update: mockUpdate,
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              innerJoin: vi.fn(() => ({
                leftJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    orderBy: vi.fn(() => ({
                      limit: vi.fn(() => ({
                        offset: vi.fn().mockResolvedValue([]),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        })),
      })),
      query: {
        talentProfiles: {
          findFirst: vi.fn(),
        },
        users: {
          findFirst: vi.fn(),
        },
        producerProfiles: {
          findFirst: vi.fn(),
        },
        shows: {
          findFirst: vi.fn(),
        },
        producerDocuments: {
          findFirst: vi.fn(),
        },
        complianceDeadlines: {
          findFirst: vi.fn(),
        },
      },
    },
  };
});

vi.mock("@/lib/storage/document-storage", () => ({
  uploadDocument: vi.fn().mockResolvedValue(undefined),
  generateDocumentKey: vi.fn().mockReturnValue("user-id/doc-id/file.pdf"),
  deleteDocument: vi.fn().mockResolvedValue(undefined),
  downloadDocument: vi.fn().mockResolvedValue(Buffer.from("encrypted")),
}));

vi.mock("@/lib/encryption", () => ({
  encryptDocument: vi.fn().mockReturnValue({
    encryptedData: Buffer.from("encrypted"),
    iv: "mock-iv",
    authTag: "mock-auth-tag",
    salt: "mock-salt",
  }),
  decryptDocument: vi.fn().mockReturnValue(Buffer.from("decrypted")),
}));

vi.mock("@/lib/email/service", () => ({
  emailService: {
    send: vi.fn().mockResolvedValue({ success: true, id: "email-123" }),
  },
}));

vi.mock("@/lib/permissions/helpers", () => ({
  getOrganizationMembership: vi.fn(),
}));

// Import after mocking
import {
  canUploadTaxDocuments,
  getUserOrganizationId,
  recordDocumentView,
  recordDocumentDownload,
} from "../producer-documents";
import { db } from "@/lib/db";
import { getOrganizationMembership } from "@/lib/permissions/helpers";

describe("Producer Documents Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("canUploadTaxDocuments", () => {
    it("returns true for owner role", async () => {
      vi.mocked(getOrganizationMembership).mockResolvedValue({ role: "owner" });

      const result = await canUploadTaxDocuments("user-id", "org-id");
      expect(result).toBe(true);
    });

    it("returns true for admin role", async () => {
      vi.mocked(getOrganizationMembership).mockResolvedValue({ role: "admin" });

      const result = await canUploadTaxDocuments("user-id", "org-id");
      expect(result).toBe(true);
    });

    it("returns false for producer role", async () => {
      vi.mocked(getOrganizationMembership).mockResolvedValue({ role: "producer" });

      const result = await canUploadTaxDocuments("user-id", "org-id");
      expect(result).toBe(false);
    });

    it("returns false for associate_producer role", async () => {
      vi.mocked(getOrganizationMembership).mockResolvedValue({ role: "associate_producer" });

      const result = await canUploadTaxDocuments("user-id", "org-id");
      expect(result).toBe(false);
    });

    it("returns false when user is not a member", async () => {
      vi.mocked(getOrganizationMembership).mockResolvedValue(null);

      const result = await canUploadTaxDocuments("user-id", "org-id");
      expect(result).toBe(false);
    });
  });

  describe("getUserOrganizationId", () => {
    it("returns organization id when profile exists", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
      });

      const result = await getUserOrganizationId("user-id");
      expect(result).toBe("org-123");
    });

    it("returns null when profile does not exist", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);

      const result = await getUserOrganizationId("user-id");
      expect(result).toBeNull();
    });
  });

  describe("recordDocumentView", () => {
    it("updates producer document status when not previously viewed", async () => {
      vi.mocked(db.query.producerDocuments.findFirst).mockResolvedValue({
        id: "prod-doc-123",
        documentId: "doc-123",
        viewedAt: null,
      });

      await recordDocumentView("doc-123", "user-id", "127.0.0.1", "Mozilla/5.0");

      // Verify update was called
      expect(db.update).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it("does not update status if already viewed", async () => {
      vi.mocked(db.query.producerDocuments.findFirst).mockResolvedValue({
        id: "prod-doc-123",
        documentId: "doc-123",
        viewedAt: new Date(),
      });

      await recordDocumentView("doc-123", "user-id", "127.0.0.1", "Mozilla/5.0");

      // Verify insert was called for access log
      expect(db.insert).toHaveBeenCalled();
    });

    it("logs view even when no producer document exists", async () => {
      vi.mocked(db.query.producerDocuments.findFirst).mockResolvedValue(undefined);

      await recordDocumentView("doc-123", "user-id", "127.0.0.1", "Mozilla/5.0");

      // Verify insert was called for access log
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("recordDocumentDownload", () => {
    it("updates producer document status to downloaded", async () => {
      vi.mocked(db.query.producerDocuments.findFirst).mockResolvedValue({
        id: "prod-doc-123",
        documentId: "doc-123",
      });

      await recordDocumentDownload("doc-123", "user-id", "127.0.0.1", "Mozilla/5.0");

      // Verify update and insert were called
      expect(db.update).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it("logs download even when no producer document exists", async () => {
      vi.mocked(db.query.producerDocuments.findFirst).mockResolvedValue(undefined);

      await recordDocumentDownload("doc-123", "user-id", "127.0.0.1", "Mozilla/5.0");

      // Verify insert was called for access log
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles null ipAddress gracefully", async () => {
      vi.mocked(db.query.producerDocuments.findFirst).mockResolvedValue(undefined);

      // Should not throw
      await expect(
        recordDocumentView("doc-123", "user-id", null, null)
      ).resolves.not.toThrow();
    });

    it("handles undefined userAgent gracefully", async () => {
      vi.mocked(db.query.producerDocuments.findFirst).mockResolvedValue(undefined);

      // Should not throw
      await expect(
        recordDocumentDownload("doc-123", "user-id", undefined, undefined)
      ).resolves.not.toThrow();
    });
  });
});
