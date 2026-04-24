import { describe, it, expect } from "vitest";
import {
  showCreateSchema,
  showUpdateSchema,
  roleCreateSchema,
  roleUpdateSchema,
  roleBulkCreateSchema,
  roleBulkUpdateSchema,
} from "../shows";

describe("Show Validation", () => {
  describe("showCreateSchema", () => {
    it("accepts valid show with minimal fields", () => {
      const show = {
        title: "Hamilton",
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(true);
    });

    it("accepts valid show with all fields", () => {
      const show = {
        title: "Hamilton",
        type: "musical" as const,
        description: "A musical about Alexander Hamilton",
        venue: "Richard Rodgers Theatre",
        rehearsalStart: new Date("2024-01-15"),
        performanceStart: new Date("2024-03-01"),
        performanceEnd: new Date("2024-06-30"),
        unionStatus: "union" as const,
        status: "planning" as const,
        isPublic: true,
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(true);
    });

    it("rejects show without title", () => {
      const show = {
        type: "musical" as const,
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(false);
    });

    it("rejects show with empty title", () => {
      const show = {
        title: "",
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(false);
    });

    it("rejects title that is too long", () => {
      const show = {
        title: "a".repeat(256),
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(false);
    });

    it("accepts all valid show types", () => {
      const types = ["musical", "play", "opera", "dance", "concert", "other"];

      for (const type of types) {
        const show = { title: "Test", type };
        expect(showCreateSchema.safeParse(show).success).toBe(true);
      }
    });

    it("rejects invalid show type", () => {
      const show = {
        title: "Test",
        type: "invalid_type",
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(false);
    });

    it("accepts all valid show statuses", () => {
      const statuses = ["planning", "auditions", "rehearsal", "running", "closed"];

      for (const status of statuses) {
        const show = { title: "Test", status };
        expect(showCreateSchema.safeParse(show).success).toBe(true);
      }
    });

    it("rejects performance end date before start date", () => {
      const show = {
        title: "Test",
        performanceStart: new Date("2024-06-01"),
        performanceEnd: new Date("2024-05-01"),
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(false);
    });

    it("accepts same performance start and end date", () => {
      const show = {
        title: "Test",
        performanceStart: new Date("2024-06-01"),
        performanceEnd: new Date("2024-06-01"),
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(true);
    });

    it("coerces date strings to Date objects", () => {
      const show = {
        title: "Test",
        performanceStart: "2024-06-01",
      };

      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.performanceStart).toBeInstanceOf(Date);
      }
    });

    it("defaults type to play", () => {
      const show = { title: "Test" };
      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("play");
      }
    });

    it("defaults status to planning", () => {
      const show = { title: "Test" };
      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("planning");
      }
    });

    it("defaults isPublic to true", () => {
      const show = { title: "Test" };
      const result = showCreateSchema.safeParse(show);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
      }
    });
  });

  describe("showUpdateSchema", () => {
    it("accepts partial updates", () => {
      const update = {
        description: "Updated description",
      };

      expect(showUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update object", () => {
      expect(showUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("validates title when provided", () => {
      const update = { title: "" };
      expect(showUpdateSchema.safeParse(update).success).toBe(false);
    });
  });
});

describe("Role Validation", () => {
  describe("roleCreateSchema", () => {
    it("accepts valid role with minimal fields", () => {
      const role = {
        name: "Hamlet",
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(true);
    });

    it("accepts valid role with all fields", () => {
      const role = {
        name: "Eliza Hamilton",
        description: "Alexander Hamilton's wife",
        type: "lead" as const,
        ageRangeMin: 25,
        ageRangeMax: 35,
        vocalRange: "Mezzo-Soprano",
        notes: "Must be able to sing and dance",
        positionCount: 1,
        sortOrder: 0,
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(true);
    });

    it("rejects role without name", () => {
      const role = {
        type: "lead" as const,
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(false);
    });

    it("rejects role with empty name", () => {
      const role = {
        name: "",
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(false);
    });

    it("rejects name that is too long", () => {
      const role = {
        name: "a".repeat(256),
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(false);
    });

    it("accepts all valid role types", () => {
      const types = ["lead", "supporting", "ensemble", "understudy", "swing"];

      for (const type of types) {
        const role = { name: "Test", type };
        expect(roleCreateSchema.safeParse(role).success).toBe(true);
      }
    });

    it("rejects invalid role type", () => {
      const role = {
        name: "Test",
        type: "invalid_type",
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(false);
    });

    it("rejects negative age range", () => {
      const role = {
        name: "Test",
        ageRangeMin: -5,
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(false);
    });

    it("rejects age range over 120", () => {
      const role = {
        name: "Test",
        ageRangeMax: 150,
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(false);
    });

    it("rejects positionCount less than 1", () => {
      const role = {
        name: "Test",
        positionCount: 0,
      };

      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(false);
    });

    it("defaults type to supporting", () => {
      const role = { name: "Test" };
      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("supporting");
      }
    });

    it("defaults positionCount to 1", () => {
      const role = { name: "Test" };
      const result = roleCreateSchema.safeParse(role);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.positionCount).toBe(1);
      }
    });
  });

  describe("roleUpdateSchema", () => {
    it("accepts partial updates", () => {
      const update = {
        description: "Updated description",
      };

      expect(roleUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update object", () => {
      expect(roleUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("validates name when provided", () => {
      const update = { name: "" };
      expect(roleUpdateSchema.safeParse(update).success).toBe(false);
    });
  });

  describe("roleBulkCreateSchema", () => {
    it("accepts valid bulk create payload", () => {
      const bulk = {
        roles: [{ name: "Role 1" }, { name: "Role 2" }],
      };

      expect(roleBulkCreateSchema.safeParse(bulk).success).toBe(true);
    });

    it("rejects empty roles array", () => {
      const bulk = { roles: [] };

      expect(roleBulkCreateSchema.safeParse(bulk).success).toBe(false);
    });

    it("rejects more than 50 roles", () => {
      const roles = Array.from({ length: 51 }, (_, i) => ({
        name: `Role ${String(i)}`,
      }));

      expect(roleBulkCreateSchema.safeParse({ roles }).success).toBe(false);
    });

    it("validates each role in the array", () => {
      const bulk = {
        roles: [{ name: "Valid" }, { name: "" }],
      };

      expect(roleBulkCreateSchema.safeParse(bulk).success).toBe(false);
    });
  });

  describe("roleBulkUpdateSchema", () => {
    it("accepts valid bulk update payload", () => {
      const bulk = {
        roles: [
          { id: "550e8400-e29b-41d4-a716-446655440000", sortOrder: 0 },
          { id: "550e8400-e29b-41d4-a716-446655440001", sortOrder: 1 },
        ],
      };

      expect(roleBulkUpdateSchema.safeParse(bulk).success).toBe(true);
    });

    it("rejects empty roles array", () => {
      const bulk = { roles: [] };

      expect(roleBulkUpdateSchema.safeParse(bulk).success).toBe(false);
    });

    it("rejects invalid UUID", () => {
      const bulk = {
        roles: [{ id: "not-a-uuid", sortOrder: 0 }],
      };

      expect(roleBulkUpdateSchema.safeParse(bulk).success).toBe(false);
    });

    it("rejects missing sortOrder", () => {
      const bulk = {
        roles: [{ id: "550e8400-e29b-41d4-a716-446655440000" }],
      };

      expect(roleBulkUpdateSchema.safeParse(bulk).success).toBe(false);
    });
  });
});
