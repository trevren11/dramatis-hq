import { describe, it, expect } from "vitest";
import {
  composeMessageSchema,
  replyMessageSchema,
  updateMessageSchema,
  searchMessagesSchema,
  inboxQuerySchema,
  conversationActionSchema,
  bulkConversationActionSchema,
  messageTemplateSchema,
  bulkSendSchema,
} from "../messages";

describe("Message Validation Schemas", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const validUuid2 = "550e8400-e29b-41d4-a716-446655440001";

  describe("composeMessageSchema", () => {
    it("should validate a valid compose message", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello, world!",
        conversationType: "direct" as const,
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require at least one recipient", () => {
      const input = {
        recipientIds: [],
        content: "Hello!",
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("At least one recipient is required");
      }
    });

    it("should require valid UUIDs for recipients", () => {
      const input = {
        recipientIds: ["not-a-uuid"],
        content: "Hello!",
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should require content", () => {
      const input = {
        recipientIds: [validUuid],
        content: "",
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should enforce max content length of 10000", () => {
      const input = {
        recipientIds: [validUuid],
        content: "a".repeat(10001),
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow optional subject", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello!",
        subject: "Test Subject",
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should enforce max subject length of 255", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello!",
        subject: "a".repeat(256),
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow null subject", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello!",
        subject: null,
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should default conversationType to direct", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello!",
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conversationType).toBe("direct");
      }
    });

    it("should validate conversation types", () => {
      for (const type of ["direct", "group", "show_cast"] as const) {
        const input = {
          recipientIds: [validUuid],
          content: "Hello!",
          conversationType: type,
        };

        const result = composeMessageSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid conversation type", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello!",
        conversationType: "invalid",
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should validate attachments array", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello!",
        attachments: [
          {
            id: "attachment-1",
            name: "file.pdf",
            url: "https://example.com/file.pdf",
            type: "application/pdf",
            size: 1024,
          },
        ],
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require valid URL for attachments", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Hello!",
        attachments: [
          {
            id: "attachment-1",
            name: "file.pdf",
            url: "not-a-url",
            type: "application/pdf",
            size: 1024,
          },
        ],
      };

      const result = composeMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("replyMessageSchema", () => {
    it("should validate a valid reply", () => {
      const input = {
        content: "This is a reply",
      };

      const result = replyMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require content", () => {
      const input = {
        content: "",
      };

      const result = replyMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow optional parentMessageId", () => {
      const input = {
        content: "Threaded reply",
        parentMessageId: validUuid,
      };

      const result = replyMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require valid UUID for parentMessageId", () => {
      const input = {
        content: "Reply",
        parentMessageId: "not-a-uuid",
      };

      const result = replyMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow attachments", () => {
      const input = {
        content: "Reply with attachment",
        attachments: [
          {
            id: "att-1",
            name: "doc.pdf",
            url: "https://example.com/doc.pdf",
            type: "application/pdf",
            size: 2048,
          },
        ],
      };

      const result = replyMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("updateMessageSchema", () => {
    it("should validate a valid update", () => {
      const input = {
        content: "Updated content",
      };

      const result = updateMessageSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require content", () => {
      const input = {
        content: "",
      };

      const result = updateMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should enforce max content length", () => {
      const input = {
        content: "a".repeat(10001),
      };

      const result = updateMessageSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("searchMessagesSchema", () => {
    it("should validate a valid search query", () => {
      const input = {
        query: "search term",
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require query", () => {
      const input = {
        query: "",
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should enforce max query length of 255", () => {
      const input = {
        query: "a".repeat(256),
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow optional filters", () => {
      const input = {
        query: "test",
        conversationId: validUuid,
        senderId: validUuid2,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should coerce dates", () => {
      const input = {
        query: "test",
        startDate: "2024-01-01",
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
      }
    });

    it("should default limit to 20", () => {
      const input = {
        query: "test",
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("should default offset to 0", () => {
      const input = {
        query: "test",
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });

    it("should enforce limit bounds", () => {
      const result1 = searchMessagesSchema.safeParse({ query: "test", limit: 0 });
      expect(result1.success).toBe(false);

      const result2 = searchMessagesSchema.safeParse({ query: "test", limit: 101 });
      expect(result2.success).toBe(false);
    });

    it("should coerce limit from string", () => {
      const input = {
        query: "test",
        limit: "50",
      };

      const result = searchMessagesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });
  });

  describe("inboxQuerySchema", () => {
    it("should validate with defaults", () => {
      const input = {};

      const result = inboxQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filter).toBe("all");
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it("should validate filter options", () => {
      for (const filter of ["all", "unread", "archived"] as const) {
        const result = inboxQuerySchema.safeParse({ filter });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid filter", () => {
      const result = inboxQuerySchema.safeParse({ filter: "invalid" });
      expect(result.success).toBe(false);
    });

    it("should coerce limit and offset", () => {
      const input = {
        limit: "50",
        offset: "10",
      };

      const result = inboxQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(10);
      }
    });
  });

  describe("conversationActionSchema", () => {
    it("should validate all action types", () => {
      const actions = ["archive", "unarchive", "mute", "unmute", "markRead"] as const;

      for (const action of actions) {
        const result = conversationActionSchema.safeParse({ action });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid action", () => {
      const result = conversationActionSchema.safeParse({ action: "delete" });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkConversationActionSchema", () => {
    it("should validate bulk actions", () => {
      const input = {
        conversationIds: [validUuid, validUuid2],
        action: "archive" as const,
      };

      const result = bulkConversationActionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require at least one conversation", () => {
      const input = {
        conversationIds: [],
        action: "archive",
      };

      const result = bulkConversationActionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should validate all bulk action types", () => {
      const actions = ["archive", "unarchive", "markRead", "delete"] as const;

      for (const action of actions) {
        const input = {
          conversationIds: [validUuid],
          action,
        };

        const result = bulkConversationActionSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("should require valid UUIDs", () => {
      const input = {
        conversationIds: ["not-valid"],
        action: "archive",
      };

      const result = bulkConversationActionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("messageTemplateSchema", () => {
    it("should validate a valid template", () => {
      const input = {
        name: "Welcome Template",
        content: "Welcome to the show!",
      };

      const result = messageTemplateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require name", () => {
      const input = {
        name: "",
        content: "Content",
      };

      const result = messageTemplateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should require content", () => {
      const input = {
        name: "Template",
        content: "",
      };

      const result = messageTemplateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow optional subject", () => {
      const input = {
        name: "Template",
        subject: "Subject Line",
        content: "Content",
      };

      const result = messageTemplateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should allow null subject", () => {
      const input = {
        name: "Template",
        subject: null,
        content: "Content",
      };

      const result = messageTemplateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should enforce max name length", () => {
      const input = {
        name: "a".repeat(256),
        content: "Content",
      };

      const result = messageTemplateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkSendSchema", () => {
    it("should validate a valid bulk send", () => {
      const input = {
        recipientIds: [validUuid, validUuid2],
        content: "Bulk message content",
      };

      const result = bulkSendSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require at least one recipient", () => {
      const input = {
        recipientIds: [],
        content: "Content",
      };

      const result = bulkSendSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow optional template ID", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Content",
        templateId: validUuid2,
      };

      const result = bulkSendSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should require valid UUID for templateId", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Content",
        templateId: "not-valid",
      };

      const result = bulkSendSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should allow optional scheduledAt date", () => {
      const input = {
        recipientIds: [validUuid],
        content: "Scheduled message",
        scheduledAt: "2024-12-25T10:00:00Z",
      };

      const result = bulkSendSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledAt).toBeInstanceOf(Date);
      }
    });

    it("should allow optional subject", () => {
      const input = {
        recipientIds: [validUuid],
        subject: "Bulk Subject",
        content: "Content",
      };

      const result = bulkSendSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
