import { describe, it, expect } from "vitest";
import {
  castingAssignmentCreateSchema,
  castingAssignmentUpdateSchema,
  castingMoveSchema,
  castingDeckAddSchema,
  castingDeckReorderSchema,
  castingPresenceUpdateSchema,
  castingBulkLockSchema,
  castingBulkStatusSchema,
} from "../casting";

describe("castingAssignmentCreateSchema", () => {
  it("should validate valid assignment data", () => {
    const result = castingAssignmentCreateSchema.safeParse({
      roleId: "550e8400-e29b-41d4-a716-446655440000",
      talentProfileId: "550e8400-e29b-41d4-a716-446655440001",
      slotIndex: 0,
      status: "draft",
    });
    expect(result.success).toBe(true);
  });

  it("should use default values", () => {
    const result = castingAssignmentCreateSchema.safeParse({
      roleId: "550e8400-e29b-41d4-a716-446655440000",
      talentProfileId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slotIndex).toBe(0);
      expect(result.data.status).toBe("draft");
    }
  });

  it("should reject invalid UUIDs", () => {
    const result = castingAssignmentCreateSchema.safeParse({
      roleId: "invalid-uuid",
      talentProfileId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status values", () => {
    const result = castingAssignmentCreateSchema.safeParse({
      roleId: "550e8400-e29b-41d4-a716-446655440000",
      talentProfileId: "550e8400-e29b-41d4-a716-446655440001",
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject notes over 2000 characters", () => {
    const result = castingAssignmentCreateSchema.safeParse({
      roleId: "550e8400-e29b-41d4-a716-446655440000",
      talentProfileId: "550e8400-e29b-41d4-a716-446655440001",
      notes: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("castingAssignmentUpdateSchema", () => {
  it("should validate partial updates", () => {
    const result = castingAssignmentUpdateSchema.safeParse({
      isLocked: true,
    });
    expect(result.success).toBe(true);
  });

  it("should validate status updates", () => {
    const result = castingAssignmentUpdateSchema.safeParse({
      status: "confirmed",
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative slot index", () => {
    const result = castingAssignmentUpdateSchema.safeParse({
      slotIndex: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("castingMoveSchema", () => {
  it("should validate pool to role move", () => {
    const result = castingMoveSchema.safeParse({
      talentProfileId: "550e8400-e29b-41d4-a716-446655440000",
      source: { type: "pool" },
      destination: {
        type: "role",
        roleId: "550e8400-e29b-41d4-a716-446655440001",
        slotIndex: 0,
      },
    });
    expect(result.success).toBe(true);
  });

  it("should validate role to deck move", () => {
    const result = castingMoveSchema.safeParse({
      talentProfileId: "550e8400-e29b-41d4-a716-446655440000",
      source: {
        type: "role",
        roleId: "550e8400-e29b-41d4-a716-446655440001",
        slotIndex: 0,
      },
      destination: { type: "deck" },
    });
    expect(result.success).toBe(true);
  });

  it("should validate deck to pool move", () => {
    const result = castingMoveSchema.safeParse({
      talentProfileId: "550e8400-e29b-41d4-a716-446655440000",
      source: { type: "deck" },
      destination: { type: "pool" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid source type", () => {
    const result = castingMoveSchema.safeParse({
      talentProfileId: "550e8400-e29b-41d4-a716-446655440000",
      source: { type: "invalid" },
      destination: { type: "pool" },
    });
    expect(result.success).toBe(false);
  });
});

describe("castingDeckAddSchema", () => {
  it("should validate valid deck add", () => {
    const result = castingDeckAddSchema.safeParse({
      talentProfileId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it("should accept custom sort order", () => {
    const result = castingDeckAddSchema.safeParse({
      talentProfileId: "550e8400-e29b-41d4-a716-446655440000",
      sortOrder: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(5);
    }
  });
});

describe("castingDeckReorderSchema", () => {
  it("should validate valid reorder", () => {
    const result = castingDeckReorderSchema.safeParse({
      items: [
        { talentProfileId: "550e8400-e29b-41d4-a716-446655440000", sortOrder: 0 },
        { talentProfileId: "550e8400-e29b-41d4-a716-446655440001", sortOrder: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty items array", () => {
    const result = castingDeckReorderSchema.safeParse({
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("castingPresenceUpdateSchema", () => {
  it("should validate presence update", () => {
    const result = castingPresenceUpdateSchema.safeParse({
      selectedTalentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null values", () => {
    const result = castingPresenceUpdateSchema.safeParse({
      selectedTalentId: null,
      cursorPosition: null,
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = castingPresenceUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("castingBulkLockSchema", () => {
  it("should validate bulk lock", () => {
    const result = castingBulkLockSchema.safeParse({
      assignmentIds: ["550e8400-e29b-41d4-a716-446655440000"],
      isLocked: true,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty assignment IDs", () => {
    const result = castingBulkLockSchema.safeParse({
      assignmentIds: [],
      isLocked: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("castingBulkStatusSchema", () => {
  it("should validate bulk status update", () => {
    const result = castingBulkStatusSchema.safeParse({
      assignmentIds: ["550e8400-e29b-41d4-a716-446655440000"],
      status: "confirmed",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status", () => {
    const result = castingBulkStatusSchema.safeParse({
      assignmentIds: ["550e8400-e29b-41d4-a716-446655440000"],
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
