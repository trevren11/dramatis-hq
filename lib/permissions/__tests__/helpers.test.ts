/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PERMISSIONS, ORGANIZATION_ROLE_PERMISSIONS, SHOW_ROLE_PERMISSIONS } from "../types";

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      shows: {
        findFirst: vi.fn(),
      },
      producerProfiles: {
        findFirst: vi.fn(),
      },
      organizationMembers: {
        findFirst: vi.fn(),
      },
      showMembers: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

// Import after mocking
import { db } from "@/lib/db";
import {
  getShowOrganizationId,
  getOrganizationMembership,
  getShowMembership,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageStaff,
  isOrganizationOwner,
  requirePermission,
} from "../helpers";

describe("Permission Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getShowOrganizationId", () => {
    it("should return organization ID when show exists", async () => {
      const mockShow = { organizationId: "org-123" };
      vi.mocked(db.query.shows.findFirst).mockResolvedValue(mockShow as never);

      const result = await getShowOrganizationId("show-123");

      expect(result).toBe("org-123");
    });

    it("should return null when show does not exist", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue(undefined);

      const result = await getShowOrganizationId("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getOrganizationMembership", () => {
    it("should return owner role when user owns the organization", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await getOrganizationMembership("user-123", "org-123");

      expect(result).toEqual({ role: "owner" });
    });

    it("should return member role from organization_members table", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
        role: "admin",
        acceptedAt: new Date(),
      } as never);

      const result = await getOrganizationMembership("user-123", "org-123");

      expect(result).toEqual({ role: "admin" });
    });

    it("should return null when user is not a member and invitation not accepted", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
        role: "admin",
        acceptedAt: null,
      } as never);

      const result = await getOrganizationMembership("user-123", "org-123");

      expect(result).toBeNull();
    });

    it("should return null when no membership exists", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue(undefined);

      const result = await getOrganizationMembership("user-123", "org-123");

      expect(result).toBeNull();
    });
  });

  describe("getShowMembership", () => {
    it("should return show membership when accepted", async () => {
      vi.mocked(db.query.showMembers.findFirst).mockResolvedValue({
        role: "director",
        permissions: ["extra:permission"],
        acceptedAt: new Date(),
      } as never);

      const result = await getShowMembership("user-123", "show-123");

      expect(result).toEqual({
        role: "director",
        permissions: ["extra:permission"],
      });
    });

    it("should return null when not accepted", async () => {
      vi.mocked(db.query.showMembers.findFirst).mockResolvedValue({
        role: "director",
        permissions: null,
        acceptedAt: null,
      } as never);

      const result = await getShowMembership("user-123", "show-123");

      expect(result).toBeNull();
    });

    it("should return null when no membership exists", async () => {
      vi.mocked(db.query.showMembers.findFirst).mockResolvedValue(undefined);

      const result = await getShowMembership("user-123", "show-123");

      expect(result).toBeNull();
    });
  });

  describe("getUserPermissions", () => {
    it("should return empty permissions for user with no memberships", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue(undefined);

      const result = await getUserPermissions("user-123");

      expect(result.userId).toBe("user-123");
      expect(result.permissions).toEqual([]);
    });

    it("should include organization permissions when user is org member", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await getUserPermissions("user-123", "show-123");

      expect(result.organizationId).toBe("org-123");
      expect(result.organizationRole).toBe("owner");
      expect(result.permissions).toContain(PERMISSIONS.ORG_MANAGE_BILLING);
    });

    it("should include show permissions when user is show member only", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.showMembers.findFirst).mockResolvedValue({
        role: "stage_manager",
        permissions: null,
        acceptedAt: new Date(),
      } as never);

      const result = await getUserPermissions("user-123", "show-123");

      expect(result.showRole).toBe("stage_manager");
      expect(result.permissions).toContain(PERMISSIONS.SCHEDULE_MANAGE);
    });

    it("should include custom permissions from show membership", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.showMembers.findFirst).mockResolvedValue({
        role: "crew_member",
        permissions: ["custom:permission"],
        acceptedAt: new Date(),
      } as never);

      const result = await getUserPermissions("user-123", "show-123");

      expect(result.permissions).toContain("custom:permission");
    });

    it("should deduplicate permissions", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await getUserPermissions("user-123", "show-123");

      const uniquePermissions = [...new Set(result.permissions)];
      expect(result.permissions.length).toBe(uniquePermissions.length);
    });
  });

  describe("hasPermission", () => {
    it("should return allowed true when user has permission", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await hasPermission("user-123", PERMISSIONS.ORG_MANAGE_BILLING, "show-123");

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should return allowed false with reason when user lacks permission", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue(undefined);

      const result = await hasPermission("user-123", PERMISSIONS.ORG_MANAGE_BILLING);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("does not have permission");
    });
  });

  describe("hasAnyPermission", () => {
    it("should return allowed true when user has at least one permission", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await hasAnyPermission(
        "user-123",
        [PERMISSIONS.ORG_MANAGE_BILLING, PERMISSIONS.SHOW_DELETE],
        "show-123"
      );

      expect(result.allowed).toBe(true);
    });

    it("should return allowed false when user has none of the permissions", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue(undefined);

      const result = await hasAnyPermission("user-123", [
        PERMISSIONS.ORG_MANAGE_BILLING,
        PERMISSIONS.SHOW_DELETE,
      ]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("does not have any");
    });
  });

  describe("hasAllPermissions", () => {
    it("should return allowed true when user has all permissions", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await hasAllPermissions(
        "user-123",
        [PERMISSIONS.SHOW_VIEW, PERMISSIONS.SHOW_EDIT],
        "show-123"
      );

      expect(result.allowed).toBe(true);
    });

    it("should return allowed false listing missing permissions", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
        role: "associate_producer",
        acceptedAt: new Date(),
      } as never);

      const result = await hasAllPermissions(
        "user-123",
        [PERMISSIONS.SHOW_VIEW, PERMISSIONS.SHOW_DELETE],
        "show-123"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("missing permissions");
      expect(result.reason).toContain(PERMISSIONS.SHOW_DELETE);
    });
  });

  describe("canManageStaff", () => {
    it("should return true for org member with manage_members permission", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await canManageStaff("user-123", undefined, "org-123");

      expect(result).toBe(true);
    });

    it("should return true for show member with manage_staff permission", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.showMembers.findFirst).mockResolvedValue({
        role: "director",
        permissions: null,
        acceptedAt: new Date(),
      } as never);

      const result = await canManageStaff("user-123", "show-123");

      expect(result).toBe(true);
    });

    it("should return false for user without manage permissions", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
        role: "associate_producer",
        acceptedAt: new Date(),
      } as never);

      const result = await canManageStaff("user-123", undefined, "org-123");

      expect(result).toBe(false);
    });

    it("should return false when no context provided", async () => {
      const result = await canManageStaff("user-123");

      expect(result).toBe(false);
    });
  });

  describe("isOrganizationOwner", () => {
    it("should return true when user is the producer profile owner", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      const result = await isOrganizationOwner("user-123", "org-123");

      expect(result).toBe(true);
    });

    it("should return false when user is not the owner", async () => {
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue(undefined);

      const result = await isOrganizationOwner("user-123", "org-123");

      expect(result).toBe(false);
    });
  });

  describe("requirePermission", () => {
    it("should not throw when user has permission", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue({
        organizationId: "org-123",
      } as never);
      vi.mocked(db.query.producerProfiles.findFirst).mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      } as never);

      await expect(
        requirePermission("user-123", PERMISSIONS.SHOW_VIEW, "show-123")
      ).resolves.not.toThrow();
    });

    it("should throw when user lacks permission", async () => {
      vi.mocked(db.query.shows.findFirst).mockResolvedValue(undefined);

      await expect(requirePermission("user-123", PERMISSIONS.ORG_MANAGE_BILLING)).rejects.toThrow(
        "does not have permission"
      );
    });
  });
});

describe("Role Permission Mapping Integrity", () => {
  it("should map all organization roles to permissions arrays", () => {
    const roles = ["owner", "admin", "producer", "associate_producer"] as const;
    for (const role of roles) {
      expect(ORGANIZATION_ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(ORGANIZATION_ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it("should map all show roles to permissions arrays", () => {
    const roles = [
      "director",
      "music_director",
      "choreographer",
      "stage_manager",
      "assistant_stage_manager",
      "production_manager",
      "technical_director",
      "lighting_designer",
      "sound_designer",
      "costume_designer",
      "scenic_designer",
      "props_master",
      "hair_makeup_designer",
      "dramaturg",
      "assistant_director",
      "crew_member",
    ] as const;
    for (const role of roles) {
      expect(SHOW_ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(SHOW_ROLE_PERMISSIONS[role])).toBe(true);
    }
  });
});
