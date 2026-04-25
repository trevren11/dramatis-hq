import { describe, it, expect } from "vitest";
import {
  pushSubscribeSchema,
  pushUnsubscribeSchema,
  inAppNotificationCreateSchema,
  notificationQuerySchema,
  notificationPreferencesUpdateSchema,
  sendPushNotificationSchema,
} from "../../validations/push-notifications";

describe("pushSubscribeSchema", () => {
  it("validates a valid subscription", () => {
    const result = pushSubscribeSchema.safeParse({
      endpoint: "https://push.example.com/endpoint",
      keys: {
        p256dh: "test-p256dh-key",
        auth: "test-auth-key",
      },
      userAgent: "Mozilla/5.0",
      deviceName: "Test Device",
    });

    expect(result.success).toBe(true);
  });

  it("requires valid endpoint URL", () => {
    const result = pushSubscribeSchema.safeParse({
      endpoint: "invalid-url",
      keys: {
        p256dh: "test-key",
        auth: "test-auth",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("endpoint");
    }
  });

  it("requires p256dh key", () => {
    const result = pushSubscribeSchema.safeParse({
      endpoint: "https://push.example.com/endpoint",
      keys: {
        p256dh: "",
        auth: "test-auth",
      },
    });

    expect(result.success).toBe(false);
  });

  it("requires auth key", () => {
    const result = pushSubscribeSchema.safeParse({
      endpoint: "https://push.example.com/endpoint",
      keys: {
        p256dh: "test-key",
        auth: "",
      },
    });

    expect(result.success).toBe(false);
  });

  it("allows optional userAgent and deviceName", () => {
    const result = pushSubscribeSchema.safeParse({
      endpoint: "https://push.example.com/endpoint",
      keys: {
        p256dh: "test-key",
        auth: "test-auth",
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("pushUnsubscribeSchema", () => {
  it("validates valid unsubscribe request", () => {
    const result = pushUnsubscribeSchema.safeParse({
      endpoint: "https://push.example.com/endpoint",
    });

    expect(result.success).toBe(true);
  });

  it("requires valid endpoint URL", () => {
    const result = pushUnsubscribeSchema.safeParse({
      endpoint: "not-a-url",
    });

    expect(result.success).toBe(false);
  });
});

describe("inAppNotificationCreateSchema", () => {
  it("validates valid notification", () => {
    const result = inAppNotificationCreateSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "new_message",
      title: "New Message",
      body: "You have a new message",
      data: {
        url: "/messages/123",
        entityType: "message",
        entityId: "msg-123",
      },
    });

    expect(result.success).toBe(true);
  });

  it("requires valid UUID for userId", () => {
    const result = inAppNotificationCreateSchema.safeParse({
      userId: "invalid-uuid",
      type: "new_message",
      title: "Title",
      body: "Body",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("userId");
    }
  });

  it("requires valid notification type", () => {
    const result = inAppNotificationCreateSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "invalid_type",
      title: "Title",
      body: "Body",
    });

    expect(result.success).toBe(false);
  });

  it("validates all notification types", () => {
    const types = [
      "new_message",
      "schedule_change",
      "rehearsal_reminder",
      "callback_notification",
      "cast_decision",
      "document_shared",
      "comment_mention",
      "audition_submission",
      "system_announcement",
    ];

    for (const type of types) {
      const result = inAppNotificationCreateSchema.safeParse({
        userId: "123e4567-e89b-12d3-a456-426614174000",
        type,
        title: "Title",
        body: "Body",
      });

      expect(result.success).toBe(true);
    }
  });

  it("requires title", () => {
    const result = inAppNotificationCreateSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "new_message",
      title: "",
      body: "Body",
    });

    expect(result.success).toBe(false);
  });

  it("limits title length to 255 characters", () => {
    const result = inAppNotificationCreateSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "new_message",
      title: "a".repeat(256),
      body: "Body",
    });

    expect(result.success).toBe(false);
  });
});

describe("notificationQuerySchema", () => {
  it("provides default values", () => {
    const result = notificationQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.unreadOnly).toBe(false);
    }
  });

  it("coerces string values to numbers", () => {
    const result = notificationQuerySchema.safeParse({
      limit: "50",
      offset: "10",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
    }
  });

  it("validates limit range", () => {
    const tooHigh = notificationQuerySchema.safeParse({ limit: 101 });
    const tooLow = notificationQuerySchema.safeParse({ limit: 0 });

    expect(tooHigh.success).toBe(false);
    expect(tooLow.success).toBe(false);
  });

  it("parses types from comma-separated string", () => {
    const result = notificationQuerySchema.safeParse({
      types: "new_message,schedule_change",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.types).toEqual(["new_message", "schedule_change"]);
    }
  });

  it("rejects invalid types", () => {
    const result = notificationQuerySchema.safeParse({
      types: "new_message,invalid_type",
    });

    expect(result.success).toBe(false);
  });
});

describe("notificationPreferencesUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = notificationPreferencesUpdateSchema.safeParse({
      pushEnabled: false,
    });

    expect(result.success).toBe(true);
  });

  it("validates all boolean preferences", () => {
    const result = notificationPreferencesUpdateSchema.safeParse({
      pushEnabled: true,
      newMessage: true,
      scheduleChange: false,
      rehearsalReminder: true,
      callbackNotification: false,
      castDecision: true,
      documentShared: false,
      commentMention: true,
      auditionSubmission: false,
      systemAnnouncement: true,
    });

    expect(result.success).toBe(true);
  });

  it("validates DND time format", () => {
    const valid = notificationPreferencesUpdateSchema.safeParse({
      dndEnabled: true,
      dndStart: "22:00",
      dndEnd: "08:00",
    });

    expect(valid.success).toBe(true);
  });

  it("rejects invalid DND time format", () => {
    const result = notificationPreferencesUpdateSchema.safeParse({
      dndStart: "10:00 PM",
    });

    expect(result.success).toBe(false);
  });

  it("allows null DND times", () => {
    const result = notificationPreferencesUpdateSchema.safeParse({
      dndStart: null,
      dndEnd: null,
    });

    expect(result.success).toBe(true);
  });
});

describe("sendPushNotificationSchema", () => {
  it("validates valid push notification", () => {
    const result = sendPushNotificationSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "new_message",
      title: "New Message",
      body: "You have a new message",
      url: "/messages/123",
      entityType: "message",
      entityId: "msg-123",
      data: { custom: "data" },
    });

    expect(result.success).toBe(true);
  });

  it("requires userId, type, title, and body", () => {
    const result = sendPushNotificationSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("userId");
      expect(paths).toContain("type");
      expect(paths).toContain("title");
      expect(paths).toContain("body");
    }
  });

  it("allows optional fields", () => {
    const result = sendPushNotificationSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "new_message",
      title: "Title",
      body: "Body",
    });

    expect(result.success).toBe(true);
  });
});
