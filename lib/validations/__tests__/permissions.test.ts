import { describe, it, expect } from "vitest";
import {
  createOrganizationInviteSchema,
  updateOrganizationMemberSchema,
  createShowInviteSchema,
  updateShowMemberSchema,
  invitationResponseSchema,
} from "../permissions";

describe("Permissions Validation", () => {
  describe("createOrganizationInviteSchema", () => {
    it("accepts valid organization invite", () => {
      const validInvite = {
        email: "user@example.com",
        role: "producer",
      };

      expect(createOrganizationInviteSchema.safeParse(validInvite).success).toBe(true);
    });

    it("accepts all valid organization roles", () => {
      const roles = ["owner", "admin", "producer", "associate_producer"];

      for (const role of roles) {
        const invite = {
          email: "user@example.com",
          role,
        };
        expect(createOrganizationInviteSchema.safeParse(invite).success).toBe(true);
      }
    });

    it("rejects invalid email", () => {
      const invite = {
        email: "not-an-email",
        role: "producer",
      };

      const result = createOrganizationInviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid email address");
      }
    });

    it("rejects missing email", () => {
      const invite = {
        role: "producer",
      };

      expect(createOrganizationInviteSchema.safeParse(invite).success).toBe(false);
    });

    it("rejects invalid organization role", () => {
      const invite = {
        email: "user@example.com",
        role: "director",
      };

      const result = createOrganizationInviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid organization role");
      }
    });

    it("rejects missing role", () => {
      const invite = {
        email: "user@example.com",
      };

      expect(createOrganizationInviteSchema.safeParse(invite).success).toBe(false);
    });
  });

  describe("updateOrganizationMemberSchema", () => {
    it("accepts valid role update", () => {
      const update = {
        role: "admin",
      };

      expect(updateOrganizationMemberSchema.safeParse(update).success).toBe(true);
    });

    it("accepts all valid organization roles", () => {
      const roles = ["owner", "admin", "producer", "associate_producer"];

      for (const role of roles) {
        expect(updateOrganizationMemberSchema.safeParse({ role }).success).toBe(true);
      }
    });

    it("rejects invalid role", () => {
      const update = {
        role: "stage_manager",
      };

      const result = updateOrganizationMemberSchema.safeParse(update);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid organization role");
      }
    });

    it("rejects missing role", () => {
      expect(updateOrganizationMemberSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("createShowInviteSchema", () => {
    it("accepts valid show invite", () => {
      const validInvite = {
        email: "user@example.com",
        role: "director",
      };

      expect(createShowInviteSchema.safeParse(validInvite).success).toBe(true);
    });

    it("accepts all valid show roles", () => {
      const roles = [
        "director",
        "music_director",
        "choreographer",
        "stage_manager",
        "assistant_stage_manager",
        "production_manager",
        "technical_director",
        "lighting_designer",
        "sound_designer",
        "costume_designer",
        "scenic_designer",
        "props_master",
        "hair_makeup_designer",
        "dramaturg",
        "assistant_director",
        "crew_member",
      ];

      for (const role of roles) {
        const invite = {
          email: "user@example.com",
          role,
        };
        expect(createShowInviteSchema.safeParse(invite).success).toBe(true);
      }
    });

    it("rejects invalid email", () => {
      const invite = {
        email: "invalid",
        role: "director",
      };

      const result = createShowInviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid email address");
      }
    });

    it("rejects organization roles for show invites", () => {
      const invite = {
        email: "user@example.com",
        role: "producer",
      };

      const result = createShowInviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid show role");
      }
    });

    it("rejects missing email", () => {
      const invite = {
        role: "director",
      };

      expect(createShowInviteSchema.safeParse(invite).success).toBe(false);
    });

    it("rejects missing role", () => {
      const invite = {
        email: "user@example.com",
      };

      expect(createShowInviteSchema.safeParse(invite).success).toBe(false);
    });
  });

  describe("updateShowMemberSchema", () => {
    it("accepts valid role update", () => {
      const update = {
        role: "stage_manager",
      };

      expect(updateShowMemberSchema.safeParse(update).success).toBe(true);
    });

    it("accepts role update with permissions", () => {
      const update = {
        role: "director",
        permissions: ["view_cast", "edit_schedule"],
      };

      expect(updateShowMemberSchema.safeParse(update).success).toBe(true);
    });

    it("accepts role update with empty permissions array", () => {
      const update = {
        role: "director",
        permissions: [],
      };

      expect(updateShowMemberSchema.safeParse(update).success).toBe(true);
    });

    it("rejects invalid show role", () => {
      const update = {
        role: "admin",
      };

      const result = updateShowMemberSchema.safeParse(update);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid show role");
      }
    });

    it("rejects missing role", () => {
      const update = {
        permissions: ["view_cast"],
      };

      expect(updateShowMemberSchema.safeParse(update).success).toBe(false);
    });

    it("rejects non-string permissions", () => {
      const update = {
        role: "director",
        permissions: [123, true],
      };

      expect(updateShowMemberSchema.safeParse(update).success).toBe(false);
    });
  });

  describe("invitationResponseSchema", () => {
    it("accepts accept action", () => {
      const response = { action: "accept" };

      expect(invitationResponseSchema.safeParse(response).success).toBe(true);
    });

    it("accepts decline action", () => {
      const response = { action: "decline" };

      expect(invitationResponseSchema.safeParse(response).success).toBe(true);
    });

    it("rejects invalid action", () => {
      const response = { action: "cancel" };

      expect(invitationResponseSchema.safeParse(response).success).toBe(false);
    });

    it("rejects missing action", () => {
      expect(invitationResponseSchema.safeParse({}).success).toBe(false);
    });

    it("rejects non-string action", () => {
      const response = { action: true };

      expect(invitationResponseSchema.safeParse(response).success).toBe(false);
    });
  });
});
