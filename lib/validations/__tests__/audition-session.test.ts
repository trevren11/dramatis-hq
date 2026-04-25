import { describe, it, expect } from "vitest";
import {
  decisionCreateSchema,
  decisionCreateWithRoleSchema,
  decisionUpdateSchema,
  decisionUpdateWithRoleSchema,
  noteCreateSchema,
  noteUpdateSchema,
  queueQuerySchema,
} from "../audition-session";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Audition Session Validation", () => {
  describe("decisionCreateSchema", () => {
    it("accepts valid decision with minimal fields", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "callback" as const,
      };

      const result = decisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it("accepts valid decision with all fields", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "cast_in_role" as const,
        roleId: validUUID,
        notes: "Perfect for this role",
      };

      const result = decisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it("accepts all valid decision values", () => {
      const decisions = ["callback", "hold_for_role", "cast_in_role", "release"];

      for (const decision of decisions) {
        const input = { talentProfileId: validUUID, decision };
        expect(decisionCreateSchema.safeParse(input).success).toBe(true);
      }
    });

    it("rejects invalid talent profile UUID", () => {
      const decision = {
        talentProfileId: "not-uuid",
        decision: "callback" as const,
      };

      const result = decisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it("rejects invalid decision value", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "invalid_decision",
      };

      const result = decisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it("rejects invalid role UUID", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "callback" as const,
        roleId: "not-uuid",
      };

      const result = decisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it("rejects notes over 2000 characters", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "callback" as const,
        notes: "a".repeat(2001),
      };

      const result = decisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it("accepts null for optional fields", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "callback" as const,
        roleId: null,
        notes: null,
      };

      const result = decisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });
  });

  describe("decisionCreateWithRoleSchema", () => {
    it("requires roleId for cast_in_role decision", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "cast_in_role" as const,
      };

      const result = decisionCreateWithRoleSchema.safeParse(decision);
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        expect(firstIssue).toBeDefined();
        expect(firstIssue?.path).toContain("roleId");
      }
    });

    it("requires roleId for hold_for_role decision", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "hold_for_role" as const,
      };

      const result = decisionCreateWithRoleSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it("accepts cast_in_role with roleId", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "cast_in_role" as const,
        roleId: validUUID,
      };

      const result = decisionCreateWithRoleSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it("accepts hold_for_role with roleId", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "hold_for_role" as const,
        roleId: validUUID,
      };

      const result = decisionCreateWithRoleSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it("does not require roleId for callback decision", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "callback" as const,
      };

      const result = decisionCreateWithRoleSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it("does not require roleId for release decision", () => {
      const decision = {
        talentProfileId: validUUID,
        decision: "release" as const,
      };

      const result = decisionCreateWithRoleSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });
  });

  describe("decisionUpdateSchema", () => {
    it("accepts partial update", () => {
      const update = {
        notes: "Updated notes",
      };

      const result = decisionUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("accepts empty update", () => {
      const result = decisionUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts decision update", () => {
      const update = {
        decision: "release" as const,
      };

      const result = decisionUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("accepts roleId update", () => {
      const update = {
        roleId: validUUID,
      };

      const result = decisionUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("rejects invalid decision value", () => {
      const update = {
        decision: "invalid",
      };

      const result = decisionUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("rejects notes over 2000 characters", () => {
      const update = {
        notes: "a".repeat(2001),
      };

      const result = decisionUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });

  describe("decisionUpdateWithRoleSchema", () => {
    it("requires roleId when updating to cast_in_role", () => {
      const update = {
        decision: "cast_in_role" as const,
      };

      const result = decisionUpdateWithRoleSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("requires roleId when updating to hold_for_role", () => {
      const update = {
        decision: "hold_for_role" as const,
      };

      const result = decisionUpdateWithRoleSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("accepts cast_in_role update with roleId", () => {
      const update = {
        decision: "cast_in_role" as const,
        roleId: validUUID,
      };

      const result = decisionUpdateWithRoleSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("accepts callback update without roleId", () => {
      const update = {
        decision: "callback" as const,
      };

      const result = decisionUpdateWithRoleSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("accepts notes-only update", () => {
      const update = {
        notes: "Just updating notes",
      };

      const result = decisionUpdateWithRoleSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe("noteCreateSchema", () => {
    it("accepts valid note", () => {
      const note = {
        talentProfileId: validUUID,
        note: "Great singing voice",
      };

      const result = noteCreateSchema.safeParse(note);
      expect(result.success).toBe(true);
    });

    it("rejects invalid talent profile UUID", () => {
      const note = {
        talentProfileId: "not-uuid",
        note: "Note",
      };

      const result = noteCreateSchema.safeParse(note);
      expect(result.success).toBe(false);
    });

    it("rejects empty note", () => {
      const note = {
        talentProfileId: validUUID,
        note: "",
      };

      const result = noteCreateSchema.safeParse(note);
      expect(result.success).toBe(false);
    });

    it("rejects note over 10000 characters", () => {
      const note = {
        talentProfileId: validUUID,
        note: "a".repeat(10001),
      };

      const result = noteCreateSchema.safeParse(note);
      expect(result.success).toBe(false);
    });

    it("accepts note at max length", () => {
      const note = {
        talentProfileId: validUUID,
        note: "a".repeat(10000),
      };

      const result = noteCreateSchema.safeParse(note);
      expect(result.success).toBe(true);
    });
  });

  describe("noteUpdateSchema", () => {
    it("accepts valid note update", () => {
      const update = {
        note: "Updated note content",
      };

      const result = noteUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("rejects empty note", () => {
      const update = {
        note: "",
      };

      const result = noteUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("rejects note over 10000 characters", () => {
      const update = {
        note: "a".repeat(10001),
      };

      const result = noteUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("rejects missing note field", () => {
      const result = noteUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("queueQuerySchema", () => {
    it("accepts empty query (uses defaults)", () => {
      const result = queueQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("all");
        expect(result.data.decision).toBe("all");
      }
    });

    it("accepts all valid status values", () => {
      const statuses = ["checked_in", "in_room", "completed", "all"];

      for (const status of statuses) {
        const result = queueQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid decision values", () => {
      const decisions = [
        "callback",
        "hold_for_role",
        "cast_in_role",
        "release",
        "undecided",
        "all",
      ];

      for (const decision of decisions) {
        const result = queueQuerySchema.safeParse({ decision });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const result = queueQuerySchema.safeParse({ status: "invalid" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid decision", () => {
      const result = queueQuerySchema.safeParse({ decision: "invalid" });
      expect(result.success).toBe(false);
    });

    it("accepts combined status and decision query", () => {
      const query = {
        status: "checked_in" as const,
        decision: "callback" as const,
      };

      const result = queueQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });
  });
});
