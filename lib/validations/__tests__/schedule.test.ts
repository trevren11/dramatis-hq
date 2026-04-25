import { describe, it, expect } from "vitest";
import {
  scheduleEventCreateSchema,
  scheduleEventUpdateSchema,
  scheduleEventQuerySchema,
  eventCastAddSchema,
  eventCastRemoveSchema,
  callSheetGenerateSchema,
} from "../schedule";

describe("scheduleEventCreateSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const validStartTime = new Date("2025-06-01T10:00:00Z");
  const validEndTime = new Date("2025-06-01T12:00:00Z");

  it("should validate valid event data", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Full Cast Rehearsal",
      eventType: "rehearsal",
      startTime: validStartTime,
      endTime: validEndTime,
    });
    expect(result.success).toBe(true);
  });

  it("should validate complete event data with optional fields", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Tech Rehearsal",
      description: "Run through all technical cues",
      eventType: "tech_rehearsal",
      location: "Main Stage",
      startTime: validStartTime,
      endTime: validEndTime,
      isAllCast: true,
      notes: "Bring scripts",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAllCast).toBe(true);
      expect(result.data.location).toBe("Main Stage");
    }
  });

  it("should use default values", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Rehearsal",
      startTime: validStartTime,
      endTime: validEndTime,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventType).toBe("rehearsal");
      expect(result.data.isAllCast).toBe(false);
    }
  });

  it("should reject missing title", () => {
    const result = scheduleEventCreateSchema.safeParse({
      startTime: validStartTime,
      endTime: validEndTime,
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "",
      startTime: validStartTime,
      endTime: validEndTime,
    });
    expect(result.success).toBe(false);
  });

  it("should reject title over 255 characters", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "a".repeat(256),
      startTime: validStartTime,
      endTime: validEndTime,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid event type", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Event",
      eventType: "invalid_type",
      startTime: validStartTime,
      endTime: validEndTime,
    });
    expect(result.success).toBe(false);
  });

  it("should reject end time before start time", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Event",
      startTime: validEndTime,
      endTime: validStartTime,
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid cast member IDs", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Scene Work",
      startTime: validStartTime,
      endTime: validEndTime,
      castMemberIds: [validUuid],
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cast member IDs", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Scene Work",
      startTime: validStartTime,
      endTime: validEndTime,
      castMemberIds: ["invalid-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid role IDs", () => {
    const result = scheduleEventCreateSchema.safeParse({
      title: "Lead Rehearsal",
      startTime: validStartTime,
      endTime: validEndTime,
      roleIds: [validUuid],
    });
    expect(result.success).toBe(true);
  });

  it("should validate all event types", () => {
    const eventTypes = [
      "rehearsal",
      "performance",
      "tech_rehearsal",
      "dress_rehearsal",
      "photo_call",
      "load_in",
      "strike",
      "custom",
    ];

    for (const eventType of eventTypes) {
      const result = scheduleEventCreateSchema.safeParse({
        title: `${eventType} Event`,
        eventType,
        startTime: validStartTime,
        endTime: validEndTime,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("scheduleEventUpdateSchema", () => {
  const validStartTime = new Date("2025-06-01T10:00:00Z");
  const validEndTime = new Date("2025-06-01T12:00:00Z");

  it("should validate partial updates", () => {
    const result = scheduleEventUpdateSchema.safeParse({
      title: "Updated Title",
    });
    expect(result.success).toBe(true);
  });

  it("should validate status updates", () => {
    const result = scheduleEventUpdateSchema.safeParse({
      status: "confirmed",
    });
    expect(result.success).toBe(true);
  });

  it("should validate all status types", () => {
    const statuses = ["scheduled", "confirmed", "cancelled", "completed"];

    for (const status of statuses) {
      const result = scheduleEventUpdateSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid status", () => {
    const result = scheduleEventUpdateSchema.safeParse({
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });

  it("should reject end time before start time when both provided", () => {
    const result = scheduleEventUpdateSchema.safeParse({
      startTime: validEndTime,
      endTime: validStartTime,
    });
    expect(result.success).toBe(false);
  });

  it("should allow updating only start time", () => {
    const result = scheduleEventUpdateSchema.safeParse({
      startTime: validStartTime,
    });
    expect(result.success).toBe(true);
  });

  it("should allow empty update", () => {
    const result = scheduleEventUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("scheduleEventQuerySchema", () => {
  it("should validate date range query", () => {
    const result = scheduleEventQuerySchema.safeParse({
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-30"),
    });
    expect(result.success).toBe(true);
  });

  it("should validate event type filter", () => {
    const result = scheduleEventQuerySchema.safeParse({
      eventType: "rehearsal",
    });
    expect(result.success).toBe(true);
  });

  it("should validate status filter", () => {
    const result = scheduleEventQuerySchema.safeParse({
      status: "confirmed",
    });
    expect(result.success).toBe(true);
  });

  it("should allow empty query", () => {
    const result = scheduleEventQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject invalid event type", () => {
    const result = scheduleEventQuerySchema.safeParse({
      eventType: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("eventCastAddSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("should validate adding cast members", () => {
    const result = eventCastAddSchema.safeParse({
      talentProfileIds: [validUuid],
    });
    expect(result.success).toBe(true);
  });

  it("should validate adding multiple cast members", () => {
    const result = eventCastAddSchema.safeParse({
      talentProfileIds: [
        validUuid,
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional role ID", () => {
    const result = eventCastAddSchema.safeParse({
      talentProfileIds: [validUuid],
      roleId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty talent profile IDs", () => {
    const result = eventCastAddSchema.safeParse({
      talentProfileIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUIDs", () => {
    const result = eventCastAddSchema.safeParse({
      talentProfileIds: ["invalid-uuid"],
    });
    expect(result.success).toBe(false);
  });
});

describe("eventCastRemoveSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("should validate removing cast members", () => {
    const result = eventCastRemoveSchema.safeParse({
      talentProfileIds: [validUuid],
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty array", () => {
    const result = eventCastRemoveSchema.safeParse({
      talentProfileIds: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("callSheetGenerateSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("should validate call sheet generation", () => {
    const result = callSheetGenerateSchema.safeParse({
      eventIds: [validUuid],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeNotes).toBe(true);
      expect(result.data.includeLocation).toBe(true);
    }
  });

  it("should accept multiple event IDs", () => {
    const result = callSheetGenerateSchema.safeParse({
      eventIds: [validUuid, "550e8400-e29b-41d4-a716-446655440001"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept options", () => {
    const result = callSheetGenerateSchema.safeParse({
      eventIds: [validUuid],
      includeNotes: false,
      includeLocation: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeNotes).toBe(false);
      expect(result.data.includeLocation).toBe(false);
    }
  });

  it("should reject empty event IDs", () => {
    const result = callSheetGenerateSchema.safeParse({
      eventIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid event IDs", () => {
    const result = callSheetGenerateSchema.safeParse({
      eventIds: ["invalid-uuid"],
    });
    expect(result.success).toBe(false);
  });
});
