import { describe, it, expect } from "vitest";
import {
  emailTypeSchema,
  emailFrequencySchema,
  updateEmailPreferenceSchema,
  updateEmailPreferencesSchema,
  unsubscribeRequestSchema,
  unsubscribeByTypeSchema,
  resendWebhookSchema,
  sendEmailRequestSchema,
  emailLogQuerySchema,
} from "../email";

describe("Email Validation", () => {
  describe("emailTypeSchema", () => {
    it("accepts valid email types", () => {
      const validTypes = [
        "welcome",
        "email_verification",
        "password_reset",
        "login_notification",
        "audition_submission",
        "callback_notification",
        "cast_notification",
        "rejection_notification",
        "schedule_update",
        "new_message",
        "document_shared",
        "rehearsal_reminder",
        "subscription_confirmation",
        "payment_receipt",
        "payment_failed",
        "subscription_ending",
      ];

      for (const type of validTypes) {
        const result = emailTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid email types", () => {
      const result = emailTypeSchema.safeParse("invalid_type");
      expect(result.success).toBe(false);
    });
  });

  describe("emailFrequencySchema", () => {
    it("accepts valid frequencies", () => {
      const validFrequencies = ["immediate", "daily", "weekly", "never"];

      for (const frequency of validFrequencies) {
        const result = emailFrequencySchema.safeParse(frequency);
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid frequencies", () => {
      const result = emailFrequencySchema.safeParse("hourly");
      expect(result.success).toBe(false);
    });
  });

  describe("updateEmailPreferenceSchema", () => {
    it("accepts valid preference update", () => {
      const data = {
        emailType: "welcome",
        enabled: true,
        frequency: "immediate",
      };

      const result = updateEmailPreferenceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts preference without frequency", () => {
      const data = {
        emailType: "new_message",
        enabled: false,
      };

      const result = updateEmailPreferenceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects missing emailType", () => {
      const data = {
        enabled: true,
      };

      const result = updateEmailPreferenceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects missing enabled", () => {
      const data = {
        emailType: "welcome",
      };

      const result = updateEmailPreferenceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("updateEmailPreferencesSchema", () => {
    it("accepts array of preferences", () => {
      const data = {
        preferences: [
          { emailType: "welcome", enabled: true },
          { emailType: "new_message", enabled: false, frequency: "daily" },
        ],
      };

      const result = updateEmailPreferencesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty array", () => {
      const data = {
        preferences: [],
      };

      const result = updateEmailPreferencesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid preference in array", () => {
      const data = {
        preferences: [
          { emailType: "welcome", enabled: true },
          { emailType: "invalid", enabled: false },
        ],
      };

      const result = updateEmailPreferencesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("unsubscribeRequestSchema", () => {
    it("accepts valid token", () => {
      const data = { token: "abc123xyz" };

      const result = unsubscribeRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects empty token", () => {
      const data = { token: "" };

      const result = unsubscribeRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects missing token", () => {
      const data = {};

      const result = unsubscribeRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("unsubscribeByTypeSchema", () => {
    it("accepts email type", () => {
      const data = { emailType: "new_message" };

      const result = unsubscribeByTypeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts unsubscribe all flag", () => {
      const data = { unsubscribeAll: true };

      const result = unsubscribeByTypeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const data = {};

      const result = unsubscribeByTypeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("resendWebhookSchema", () => {
    it("accepts valid delivered webhook", () => {
      const data = {
        type: "email.delivered",
        created_at: "2024-01-15T10:00:00Z",
        data: {
          email_id: "abc123",
          from: "noreply@example.com",
          to: ["user@example.com"],
          subject: "Test Email",
          created_at: "2024-01-15T09:59:00Z",
        },
      };

      const result = resendWebhookSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts clicked webhook with click data", () => {
      const data = {
        type: "email.clicked",
        created_at: "2024-01-15T10:00:00Z",
        data: {
          email_id: "abc123",
          from: "noreply@example.com",
          to: ["user@example.com"],
          subject: "Test Email",
          created_at: "2024-01-15T09:59:00Z",
          click: {
            link: "https://example.com/action",
            timestamp: "2024-01-15T10:00:00Z",
          },
        },
      };

      const result = resendWebhookSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts bounced webhook with bounce data", () => {
      const data = {
        type: "email.bounced",
        created_at: "2024-01-15T10:00:00Z",
        data: {
          email_id: "abc123",
          from: "noreply@example.com",
          to: ["user@example.com"],
          subject: "Test Email",
          created_at: "2024-01-15T09:59:00Z",
          bounce: {
            message: "Mailbox not found",
          },
        },
      };

      const result = resendWebhookSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid webhook type", () => {
      const data = {
        type: "email.invalid",
        created_at: "2024-01-15T10:00:00Z",
        data: {
          email_id: "abc123",
          from: "noreply@example.com",
          to: ["user@example.com"],
          subject: "Test Email",
          created_at: "2024-01-15T09:59:00Z",
        },
      };

      const result = resendWebhookSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("sendEmailRequestSchema", () => {
    it("accepts valid send request with html", () => {
      const data = {
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        type: "welcome",
      };

      const result = sendEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts multiple recipients", () => {
      const data = {
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test Subject",
        text: "Hello",
        type: "schedule_update",
      };

      const result = sendEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const data = {
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        type: "welcome",
        userId: "550e8400-e29b-41d4-a716-446655440000",
        replyTo: "support@example.com",
        cc: "cc@example.com",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
        metadata: { campaign: "welcome-series" },
      };

      const result = sendEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email address", () => {
      const data = {
        to: "invalid-email",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        type: "welcome",
      };

      const result = sendEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects empty subject", () => {
      const data = {
        to: "user@example.com",
        subject: "",
        html: "<p>Hello</p>",
        type: "welcome",
      };

      const result = sendEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects subject exceeding max length", () => {
      const data = {
        to: "user@example.com",
        subject: "a".repeat(501),
        html: "<p>Hello</p>",
        type: "welcome",
      };

      const result = sendEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects invalid userId format", () => {
      const data = {
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        type: "welcome",
        userId: "invalid-uuid",
      };

      const result = sendEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("emailLogQuerySchema", () => {
    it("accepts valid query parameters", () => {
      const data = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        type: "welcome",
        status: "sent",
        limit: 25,
        offset: 10,
      };

      const result = emailLogQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("uses default values for limit and offset", () => {
      const data = {};

      const result = emailLogQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("coerces string numbers", () => {
      const data = {
        limit: "25",
        offset: "10",
      };

      const result = emailLogQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(10);
      }
    });

    it("rejects limit exceeding max", () => {
      const data = { limit: 101 };

      const result = emailLogQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects negative offset", () => {
      const data = { offset: -1 };

      const result = emailLogQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("accepts all valid status values", () => {
      const statuses = [
        "queued",
        "sending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "complained",
        "failed",
      ];

      for (const status of statuses) {
        const data = { status };
        const result = emailLogQuerySchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });
});
