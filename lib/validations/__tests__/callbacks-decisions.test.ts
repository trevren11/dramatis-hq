import { describe, it, expect } from "vitest";
import {
  auditionDecisionCreateSchema,
  auditionDecisionUpdateSchema,
  callbackNoteSchema,
  bulkTimeSlotGenerationSchema,
  sendCallbackEmailsSchema,
  callbackListQuerySchema,
} from "../callbacks";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Callback Decisions and Utilities", () => {
  describe("auditionDecisionCreateSchema", () => {
    it("accepts valid decision", () => {
      const decision = {
        auditionId: validUUID,
        talentProfileId: validUUID,
        decision: "callback" as const,
      };

      const result = auditionDecisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it("accepts all valid decision values", () => {
      const decisions = ["callback", "hold_for_role", "cast_in_role", "release"];

      for (const decision of decisions) {
        const input = {
          auditionId: validUUID,
          talentProfileId: validUUID,
          decision,
        };
        expect(auditionDecisionCreateSchema.safeParse(input).success).toBe(true);
      }
    });

    it("rejects invalid decision value", () => {
      const decision = {
        auditionId: validUUID,
        talentProfileId: validUUID,
        decision: "invalid_decision",
      };

      const result = auditionDecisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it("rejects notes over 5000 characters", () => {
      const decision = {
        auditionId: validUUID,
        talentProfileId: validUUID,
        decision: "callback" as const,
        notes: "a".repeat(5001),
      };

      const result = auditionDecisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it("defaults round to 0", () => {
      const decision = {
        auditionId: validUUID,
        talentProfileId: validUUID,
        decision: "callback" as const,
      };

      const result = auditionDecisionCreateSchema.safeParse(decision);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.round).toBe(0);
      }
    });
  });

  describe("auditionDecisionUpdateSchema", () => {
    it("accepts partial update", () => {
      const update = { notes: "Great performance" };
      expect(auditionDecisionUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts decision update", () => {
      const update = { decision: "release" as const };
      expect(auditionDecisionUpdateSchema.safeParse(update).success).toBe(true);
    });
  });

  describe("callbackNoteSchema", () => {
    it("accepts valid note", () => {
      const note = {
        callbackSessionId: validUUID,
        talentProfileId: validUUID,
        content: "Excellent vocal range",
      };

      const result = callbackNoteSchema.safeParse(note);
      expect(result.success).toBe(true);
    });

    it("rejects note over 10000 characters", () => {
      const note = {
        callbackSessionId: validUUID,
        talentProfileId: validUUID,
        content: "a".repeat(10001),
      };

      const result = callbackNoteSchema.safeParse(note);
      expect(result.success).toBe(false);
    });

    it("rejects invalid callback session ID", () => {
      const note = {
        callbackSessionId: "not-uuid",
        talentProfileId: validUUID,
        content: "Note",
      };

      const result = callbackNoteSchema.safeParse(note);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkTimeSlotGenerationSchema", () => {
    it("accepts valid bulk generation params", () => {
      const params = {
        date: "2024-06-15",
        startTime: "09:00",
        endTime: "17:00",
        slotDurationMinutes: 30,
      };

      const result = bulkTimeSlotGenerationSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format", () => {
      const params = {
        date: "June 15",
        startTime: "09:00",
        endTime: "17:00",
      };

      const result = bulkTimeSlotGenerationSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format", () => {
      const params = {
        date: "2024-06-15",
        startTime: "9am",
        endTime: "5pm",
      };

      const result = bulkTimeSlotGenerationSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it("defaults slotDurationMinutes to 15", () => {
      const params = {
        date: "2024-06-15",
        startTime: "09:00",
        endTime: "17:00",
      };

      const result = bulkTimeSlotGenerationSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slotDurationMinutes).toBe(15);
      }
    });

    it("defaults breakDurationMinutes to 0", () => {
      const params = {
        date: "2024-06-15",
        startTime: "09:00",
        endTime: "17:00",
      };

      const result = bulkTimeSlotGenerationSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.breakDurationMinutes).toBe(0);
      }
    });
  });

  describe("sendCallbackEmailsSchema", () => {
    it("accepts valid email send request", () => {
      const request = {
        callbackSessionId: validUUID,
        subject: "Callback Invitation",
        body: "You have been selected for a callback.",
      };

      const result = sendCallbackEmailsSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("accepts with specific invitation IDs", () => {
      const request = {
        callbackSessionId: validUUID,
        invitationIds: [validUUID],
        subject: "Callback Invitation",
        body: "You are invited.",
      };

      const result = sendCallbackEmailsSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("rejects empty subject", () => {
      const request = {
        callbackSessionId: validUUID,
        subject: "",
        body: "Body content",
      };

      const result = sendCallbackEmailsSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it("rejects empty body", () => {
      const request = {
        callbackSessionId: validUUID,
        subject: "Subject",
        body: "",
      };

      const result = sendCallbackEmailsSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it("rejects subject over 200 characters", () => {
      const request = {
        callbackSessionId: validUUID,
        subject: "a".repeat(201),
        body: "Body",
      };

      const result = sendCallbackEmailsSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it("rejects body over 10000 characters", () => {
      const request = {
        callbackSessionId: validUUID,
        subject: "Subject",
        body: "a".repeat(10001),
      };

      const result = sendCallbackEmailsSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe("callbackListQuerySchema", () => {
    it("accepts valid query params", () => {
      const query = {
        auditionId: validUUID,
        page: 1,
        limit: 25,
      };

      const result = callbackListQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("accepts all sort options", () => {
      const sortOptions = ["name", "role", "scheduledTime", "createdAt"];

      for (const sortBy of sortOptions) {
        const query = { auditionId: validUUID, sortBy };
        expect(callbackListQuerySchema.safeParse(query).success).toBe(true);
      }
    });

    it("defaults page to 1", () => {
      const query = { auditionId: validUUID };
      const result = callbackListQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("defaults limit to 50", () => {
      const query = { auditionId: validUUID };
      const result = callbackListQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("coerces string page to number", () => {
      const query = { auditionId: validUUID, page: "3" };
      const result = callbackListQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it("rejects page less than 1", () => {
      const query = { auditionId: validUUID, page: 0 };
      expect(callbackListQuerySchema.safeParse(query).success).toBe(false);
    });

    it("rejects limit over 100", () => {
      const query = { auditionId: validUUID, limit: 150 };
      expect(callbackListQuerySchema.safeParse(query).success).toBe(false);
    });

    it("defaults groupByRole to false", () => {
      const query = { auditionId: validUUID };
      const result = callbackListQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupByRole).toBe(false);
      }
    });
  });
});
