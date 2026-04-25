import { describe, it, expect } from "vitest";
import {
  callbackSessionCreateSchema,
  callbackSessionUpdateSchema,
  callbackInvitationCreateSchema,
  callbackInvitationBulkCreateSchema,
  callbackInvitationUpdateSchema,
} from "../callbacks";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Callback Sessions and Invitations", () => {
  describe("callbackSessionCreateSchema", () => {
    it("accepts valid callback session with minimal fields", () => {
      const session = {
        auditionId: validUUID,
        name: "Round 2 Callbacks",
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(true);
    });

    it("accepts valid callback session with all fields", () => {
      const session = {
        auditionId: validUUID,
        name: "Round 2 Callbacks",
        round: 2,
        location: "Studio A",
        isVirtual: true,
        notes: "Please prepare a monologue",
        scheduleDates: [
          {
            date: "2024-06-15",
            slots: [{ id: "slot1", startTime: "10:00", endTime: "10:30" }],
          },
        ],
        slotDurationMinutes: 30,
        status: "scheduled" as const,
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(true);
    });

    it("rejects invalid audition UUID", () => {
      const session = {
        auditionId: "not-a-uuid",
        name: "Callbacks",
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const session = {
        auditionId: validUUID,
        name: "",
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("rejects name over 255 characters", () => {
      const session = {
        auditionId: validUUID,
        name: "a".repeat(256),
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("rejects round less than 1", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
        round: 0,
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("rejects notes over 5000 characters", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
        notes: "a".repeat(5001),
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("validates time slot format", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
        scheduleDates: [
          {
            date: "2024-06-15",
            slots: [{ id: "1", startTime: "10am", endTime: "11am" }],
          },
        ],
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("validates date format", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
        scheduleDates: [
          {
            date: "June 15, 2024",
            slots: [],
          },
        ],
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("defaults round to 1", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.round).toBe(1);
      }
    });

    it("defaults isVirtual to false", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isVirtual).toBe(false);
      }
    });

    it("defaults slotDurationMinutes to 15", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slotDurationMinutes).toBe(15);
      }
    });

    it("rejects slot duration less than 5 minutes", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
        slotDurationMinutes: 3,
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it("rejects slot duration more than 120 minutes", () => {
      const session = {
        auditionId: validUUID,
        name: "Callbacks",
        slotDurationMinutes: 150,
      };

      const result = callbackSessionCreateSchema.safeParse(session);
      expect(result.success).toBe(false);
    });
  });

  describe("callbackSessionUpdateSchema", () => {
    it("accepts partial updates", () => {
      const update = { name: "Updated Callbacks" };
      expect(callbackSessionUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update object", () => {
      expect(callbackSessionUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("omits auditionId from updates", () => {
      const update = { auditionId: validUUID };
      const result = callbackSessionUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect("auditionId" in result.data).toBe(false);
      }
    });
  });

  describe("callbackInvitationCreateSchema", () => {
    it("accepts valid invitation with minimal fields", () => {
      const invitation = {
        callbackSessionId: validUUID,
        talentProfileId: validUUID,
      };

      const result = callbackInvitationCreateSchema.safeParse(invitation);
      expect(result.success).toBe(true);
    });

    it("accepts invitation with scheduled time", () => {
      const invitation = {
        callbackSessionId: validUUID,
        talentProfileId: validUUID,
        scheduledDate: new Date("2024-06-15"),
        scheduledTime: "10:30",
      };

      const result = callbackInvitationCreateSchema.safeParse(invitation);
      expect(result.success).toBe(true);
    });

    it("rejects invalid time format", () => {
      const invitation = {
        callbackSessionId: validUUID,
        talentProfileId: validUUID,
        scheduledTime: "10am",
      };

      const result = callbackInvitationCreateSchema.safeParse(invitation);
      expect(result.success).toBe(false);
    });

    it("rejects invalid callback session ID", () => {
      const invitation = {
        callbackSessionId: "not-uuid",
        talentProfileId: validUUID,
      };

      const result = callbackInvitationCreateSchema.safeParse(invitation);
      expect(result.success).toBe(false);
    });

    it("rejects invalid talent profile ID", () => {
      const invitation = {
        callbackSessionId: validUUID,
        talentProfileId: "not-uuid",
      };

      const result = callbackInvitationCreateSchema.safeParse(invitation);
      expect(result.success).toBe(false);
    });
  });

  describe("callbackInvitationBulkCreateSchema", () => {
    it("accepts valid bulk invitations", () => {
      const bulk = {
        callbackSessionId: validUUID,
        invitations: [
          { talentProfileId: validUUID },
          { talentProfileId: "550e8400-e29b-41d4-a716-446655440001" },
        ],
      };

      const result = callbackInvitationBulkCreateSchema.safeParse(bulk);
      expect(result.success).toBe(true);
    });

    it("rejects empty invitations array", () => {
      const bulk = {
        callbackSessionId: validUUID,
        invitations: [],
      };

      const result = callbackInvitationBulkCreateSchema.safeParse(bulk);
      expect(result.success).toBe(false);
    });

    it("rejects invalid talent profile ID in bulk", () => {
      const bulk = {
        callbackSessionId: validUUID,
        invitations: [{ talentProfileId: "not-uuid" }],
      };

      const result = callbackInvitationBulkCreateSchema.safeParse(bulk);
      expect(result.success).toBe(false);
    });
  });

  describe("callbackInvitationUpdateSchema", () => {
    it("accepts valid updates", () => {
      const update = {
        scheduledTime: "14:00",
        queueNumber: 5,
      };

      const result = callbackInvitationUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("accepts checkedInAt date", () => {
      const update = {
        checkedInAt: new Date(),
      };

      const result = callbackInvitationUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("rejects invalid time format", () => {
      const update = { scheduledTime: "2pm" };
      expect(callbackInvitationUpdateSchema.safeParse(update).success).toBe(false);
    });
  });
});
