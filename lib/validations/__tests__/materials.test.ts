import { describe, it, expect } from "vitest";
import {
  scriptUploadSchema,
  scriptUpdateSchema,
  minusTrackUploadSchema,
  minusTrackUpdateSchema,
  minusTrackReorderSchema,
  materialPermissionCreateSchema,
  materialPermissionUpdateSchema,
  shareWithCastSchema,
  shareWithRolesSchema,
  shareWithUsersSchema,
  materialAccessLogQuerySchema,
} from "../materials";

describe("Script Validations", () => {
  describe("scriptUploadSchema", () => {
    it("should accept valid script upload data", () => {
      const validData = {
        title: "Opening Night Script",
        revisionNotes: "Added Act 2 revisions",
        isActive: true,
      };
      const result = scriptUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept empty data with defaults", () => {
      const result = scriptUploadSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should reject title exceeding 255 characters", () => {
      const invalidData = {
        title: "a".repeat(256),
      };
      const result = scriptUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject revision notes exceeding 2000 characters", () => {
      const invalidData = {
        revisionNotes: "a".repeat(2001),
      };
      const result = scriptUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("scriptUpdateSchema", () => {
    it("should accept partial updates", () => {
      const validData = {
        isActive: false,
      };
      const result = scriptUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe("Minus Track Validations", () => {
  describe("minusTrackUploadSchema", () => {
    it("should accept valid track data", () => {
      const validData = {
        title: "Opening Number",
        act: "1",
        scene: "3",
        trackNumber: 5,
        originalKey: "C",
        tempo: 120,
        notes: "Full orchestration",
        duration: 180,
      };
      const result = minusTrackUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require title", () => {
      const invalidData = {
        act: "1",
        scene: "3",
      };
      const result = minusTrackUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
      };
      const result = minusTrackUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding 255 characters", () => {
      const invalidData = {
        title: "a".repeat(256),
      };
      const result = minusTrackUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid tempo", () => {
      const invalidData = {
        title: "Test Track",
        tempo: 400, // Too fast
      };
      const result = minusTrackUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative track number", () => {
      const invalidData = {
        title: "Test Track",
        trackNumber: -1,
      };
      const result = minusTrackUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("minusTrackUpdateSchema", () => {
    it("should accept partial updates", () => {
      const validData = {
        tempo: 140,
      };
      const result = minusTrackUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept empty update", () => {
      const result = minusTrackUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("minusTrackReorderSchema", () => {
    it("should accept valid reorder data", () => {
      const validData = {
        tracks: [
          { id: "550e8400-e29b-41d4-a716-446655440000", sortOrder: 0 },
          { id: "550e8400-e29b-41d4-a716-446655440001", sortOrder: 1 },
        ],
      };
      const result = minusTrackReorderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require at least one track", () => {
      const invalidData = {
        tracks: [],
      };
      const result = minusTrackReorderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should require valid UUIDs", () => {
      const invalidData = {
        tracks: [{ id: "invalid-uuid", sortOrder: 0 }],
      };
      const result = minusTrackReorderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe("Permission Validations", () => {
  describe("materialPermissionCreateSchema", () => {
    it("should accept valid user permission", () => {
      const validData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "user",
        grantedToUserId: "550e8400-e29b-41d4-a716-446655440001",
        canDownload: true,
        canView: true,
      };
      const result = materialPermissionCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept valid role permission", () => {
      const validData = {
        materialType: "track",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "role",
        grantedToRoleId: "550e8400-e29b-41d4-a716-446655440001",
        canDownload: false,
        canView: true,
      };
      const result = materialPermissionCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept valid all_cast permission", () => {
      const validData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "all_cast",
        canDownload: false,
        canView: true,
      };
      const result = materialPermissionCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject user grant without user ID", () => {
      const invalidData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "user",
        canDownload: false,
        canView: true,
      };
      const result = materialPermissionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject role grant without role ID", () => {
      const invalidData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "role",
        canDownload: false,
        canView: true,
      };
      const result = materialPermissionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept expiration date", () => {
      const validData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "all_cast",
        canDownload: false,
        canView: true,
        expiresAt: "2025-12-31T23:59:59Z",
      };
      const result = materialPermissionCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresAt).toBeInstanceOf(Date);
      }
    });

    it("should reject invalid material type", () => {
      const invalidData = {
        materialType: "video",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "all_cast",
        canDownload: false,
        canView: true,
      };
      const result = materialPermissionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid grant type", () => {
      const invalidData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        grantType: "everyone",
        canDownload: false,
        canView: true,
      };
      const result = materialPermissionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("materialPermissionUpdateSchema", () => {
    it("should accept partial permission updates", () => {
      const validData = {
        canDownload: true,
      };
      const result = materialPermissionUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept expiration update", () => {
      const validData = {
        expiresAt: "2025-06-30T00:00:00Z",
      };
      const result = materialPermissionUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept null expiration (no expiry)", () => {
      const validData = {
        expiresAt: null,
      };
      const result = materialPermissionUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("shareWithCastSchema", () => {
    it("should accept valid share with cast data", () => {
      const validData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        canDownload: false,
      };
      const result = shareWithCastSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should default canDownload to false", () => {
      const validData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const result = shareWithCastSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canDownload).toBe(false);
      }
    });
  });

  describe("shareWithRolesSchema", () => {
    it("should accept valid share with roles data", () => {
      const validData = {
        materialType: "track",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        roleIds: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
        canDownload: true,
      };
      const result = shareWithRolesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require at least one role", () => {
      const invalidData = {
        materialType: "track",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        roleIds: [],
        canDownload: true,
      };
      const result = shareWithRolesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("shareWithUsersSchema", () => {
    it("should accept valid share with users data", () => {
      const validData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        userIds: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
        canDownload: false,
      };
      const result = shareWithUsersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require at least one user", () => {
      const invalidData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        userIds: [],
        canDownload: false,
      };
      const result = shareWithUsersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe("Access Log Query Validation", () => {
  describe("materialAccessLogQuerySchema", () => {
    it("should accept valid query parameters", () => {
      const validData = {
        materialType: "script",
        materialId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        action: "view",
        limit: 25,
        offset: 10,
      };
      const result = materialAccessLogQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should apply default limit and offset", () => {
      const result = materialAccessLogQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("should reject invalid action", () => {
      const invalidData = {
        action: "delete",
      };
      const result = materialAccessLogQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject limit exceeding maximum", () => {
      const invalidData = {
        limit: 200,
      };
      const result = materialAccessLogQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const invalidData = {
        offset: -1,
      };
      const result = materialAccessLogQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
