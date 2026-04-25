import { describe, it, expect } from "vitest";
import {
  emailTemplateCreateSchema,
  emailTemplateUpdateSchema,
  castNotificationCreateSchema,
  castNotificationBatchSchema,
  notificationResponseSchema,
  templatePreviewSchema,
  castListExportSchema,
} from "../notifications";

describe("emailTemplateCreateSchema", () => {
  it("should validate a valid template", () => {
    const result = emailTemplateCreateSchema.safeParse({
      name: "Cast Notification",
      type: "cast_notification",
      subject: "You've been cast!",
      body: "<p>Congratulations!</p>",
    });
    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = emailTemplateCreateSchema.safeParse({
      type: "cast_notification",
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("should require subject", () => {
    const result = emailTemplateCreateSchema.safeParse({
      name: "Template",
      type: "cast_notification",
      body: "Body",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.subject).toBeDefined();
    }
  });

  it("should require body", () => {
    const result = emailTemplateCreateSchema.safeParse({
      name: "Template",
      type: "cast_notification",
      subject: "Subject",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.body).toBeDefined();
    }
  });

  it("should validate template type", () => {
    const result = emailTemplateCreateSchema.safeParse({
      name: "Template",
      type: "invalid_type",
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid types", () => {
    const types = ["cast_notification", "callback_notification", "rejection", "custom"];
    for (const type of types) {
      const result = emailTemplateCreateSchema.safeParse({
        name: "Template",
        type,
        subject: "Subject",
        body: "Body",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should enforce name max length", () => {
    const result = emailTemplateCreateSchema.safeParse({
      name: "a".repeat(256),
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(false);
  });

  it("should enforce subject max length", () => {
    const result = emailTemplateCreateSchema.safeParse({
      name: "Template",
      subject: "a".repeat(501),
      body: "Body",
    });
    expect(result.success).toBe(false);
  });
});

describe("emailTemplateUpdateSchema", () => {
  it("should allow partial updates", () => {
    const result = emailTemplateUpdateSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("should validate provided fields", () => {
    const result = emailTemplateUpdateSchema.safeParse({
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("castNotificationCreateSchema", () => {
  it("should validate a valid notification", () => {
    const result = castNotificationCreateSchema.safeParse({
      assignmentId: "550e8400-e29b-41d4-a716-446655440000",
      subject: "You've been cast!",
      body: "<p>Congratulations!</p>",
    });
    expect(result.success).toBe(true);
  });

  it("should require valid UUID for assignmentId", () => {
    const result = castNotificationCreateSchema.safeParse({
      assignmentId: "invalid-uuid",
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional templateId", () => {
    const result = castNotificationCreateSchema.safeParse({
      assignmentId: "550e8400-e29b-41d4-a716-446655440000",
      templateId: "550e8400-e29b-41d4-a716-446655440001",
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional responseDeadline", () => {
    const result = castNotificationCreateSchema.safeParse({
      assignmentId: "550e8400-e29b-41d4-a716-446655440000",
      subject: "Subject",
      body: "Body",
      responseDeadline: "2025-01-15",
    });
    expect(result.success).toBe(true);
  });
});

describe("castNotificationBatchSchema", () => {
  it("should validate batch notification", () => {
    const result = castNotificationBatchSchema.safeParse({
      assignmentIds: ["550e8400-e29b-41d4-a716-446655440000"],
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(true);
  });

  it("should require at least one assignmentId", () => {
    const result = castNotificationBatchSchema.safeParse({
      assignmentIds: [],
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(false);
  });

  it("should validate all assignmentIds are UUIDs", () => {
    const result = castNotificationBatchSchema.safeParse({
      assignmentIds: ["550e8400-e29b-41d4-a716-446655440000", "invalid"],
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(false);
  });

  it("should default sendImmediately to true", () => {
    const result = castNotificationBatchSchema.safeParse({
      assignmentIds: ["550e8400-e29b-41d4-a716-446655440000"],
      subject: "Subject",
      body: "Body",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sendImmediately).toBe(true);
    }
  });
});

describe("notificationResponseSchema", () => {
  it("should validate accepted response", () => {
    const result = notificationResponseSchema.safeParse({
      responseType: "accepted",
    });
    expect(result.success).toBe(true);
  });

  it("should validate declined response", () => {
    const result = notificationResponseSchema.safeParse({
      responseType: "declined",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid response type", () => {
    const result = notificationResponseSchema.safeParse({
      responseType: "pending",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional responseNote", () => {
    const result = notificationResponseSchema.safeParse({
      responseType: "declined",
      responseNote: "Schedule conflict",
    });
    expect(result.success).toBe(true);
  });

  it("should enforce responseNote max length", () => {
    const result = notificationResponseSchema.safeParse({
      responseType: "declined",
      responseNote: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("templatePreviewSchema", () => {
  it("should validate preview data", () => {
    const result = templatePreviewSchema.safeParse({
      subject: "Subject with {{talent_name}}",
      body: "<p>Hello {{talent_first_name}}</p>",
    });
    expect(result.success).toBe(true);
  });

  it("should accept sample data", () => {
    const result = templatePreviewSchema.safeParse({
      subject: "Subject",
      body: "Body",
      sampleData: {
        talent_name: "John Smith",
        role_name: "Harold Hill",
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("castListExportSchema", () => {
  it("should validate CSV export", () => {
    const result = castListExportSchema.safeParse({
      format: "csv",
    });
    expect(result.success).toBe(true);
  });

  it("should validate PDF export", () => {
    const result = castListExportSchema.safeParse({
      format: "pdf",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid format", () => {
    const result = castListExportSchema.safeParse({
      format: "xlsx",
    });
    expect(result.success).toBe(false);
  });

  it("should accept filter options", () => {
    const result = castListExportSchema.safeParse({
      format: "csv",
      includeContact: true,
      includeStatus: false,
      filterStatus: ["confirmed", "tentative"],
      groupByRole: true,
    });
    expect(result.success).toBe(true);
  });

  it("should validate filterStatus values", () => {
    const result = castListExportSchema.safeParse({
      format: "csv",
      filterStatus: ["invalid_status"],
    });
    expect(result.success).toBe(false);
  });
});
