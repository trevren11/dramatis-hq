import { describe, it, expect } from "vitest";
import {
  createOrganizationInvitationSchema,
  createShowInvitationSchema,
  respondToInvitationSchema,
  changeOrganizationRoleSchema,
  changeShowRoleSchema,
  removeMemberSchema,
  resendInvitationSchema,
  cancelInvitationSchema,
} from "../staff";

describe("Staff Validation", () => {
  describe("createOrganizationInvitationSchema", () => {
    it("accepts valid organization invitation", () => {
      const invitation = {
        email: "user@example.com",
        role: "producer",
      };

      expect(createOrganizationInvitationSchema.safeParse(invitation).success).toBe(true);
    });

    it("accepts all valid organization roles", () => {
      const roles = ["owner", "admin", "producer", "associate_producer"];

      for (const role of roles) {
        const invitation = {
          email: "user@example.com",
          role,
        };
        expect(createOrganizationInvitationSchema.safeParse(invitation).success).toBe(true);
      }
    });

    it("rejects invalid email", () => {
      const invitation = {
        email: "not-valid-email",
        role: "producer",
      };

      const result = createOrganizationInvitationSchema.safeParse(invitation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Valid email is required");
      }
    });

    it("rejects empty email", () => {
      const invitation = {
        email: "",
        role: "producer",
      };

      expect(createOrganizationInvitationSchema.safeParse(invitation).success).toBe(false);
    });

    it("rejects invalid organization role", () => {
      const invitation = {
        email: "user@example.com",
        role: "director",
      };

      expect(createOrganizationInvitationSchema.safeParse(invitation).success).toBe(false);
    });

    it("rejects missing role", () => {
      const invitation = {
        email: "user@example.com",
      };

      expect(createOrganizationInvitationSchema.safeParse(invitation).success).toBe(false);
    });
  });

  describe("createShowInvitationSchema", () => {
    it("accepts valid show invitation", () => {
      const invitation = {
        email: "user@example.com",
        role: "director",
      };

      expect(createShowInvitationSchema.safeParse(invitation).success).toBe(true);
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
        const invitation = {
          email: "user@example.com",
          role,
        };
        expect(createShowInvitationSchema.safeParse(invitation).success).toBe(true);
      }
    });

    it("rejects invalid email", () => {
      const invitation = {
        email: "invalid",
        role: "director",
      };

      const result = createShowInvitationSchema.safeParse(invitation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Valid email is required");
      }
    });

    it("rejects organization roles", () => {
      const invitation = {
        email: "user@example.com",
        role: "admin",
      };

      expect(createShowInvitationSchema.safeParse(invitation).success).toBe(false);
    });
  });

  describe("respondToInvitationSchema", () => {
    it("accepts valid accept response", () => {
      const response = {
        token: "abc123token",
        accept: true,
      };

      expect(respondToInvitationSchema.safeParse(response).success).toBe(true);
    });

    it("accepts valid decline response", () => {
      const response = {
        token: "abc123token",
        accept: false,
      };

      expect(respondToInvitationSchema.safeParse(response).success).toBe(true);
    });

    it("rejects empty token", () => {
      const response = {
        token: "",
        accept: true,
      };

      const result = respondToInvitationSchema.safeParse(response);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Token is required");
      }
    });

    it("rejects missing token", () => {
      const response = {
        accept: true,
      };

      expect(respondToInvitationSchema.safeParse(response).success).toBe(false);
    });

    it("rejects missing accept boolean", () => {
      const response = {
        token: "abc123token",
      };

      expect(respondToInvitationSchema.safeParse(response).success).toBe(false);
    });

    it("rejects non-boolean accept", () => {
      const response = {
        token: "abc123token",
        accept: "yes",
      };

      expect(respondToInvitationSchema.safeParse(response).success).toBe(false);
    });
  });

  describe("changeOrganizationRoleSchema", () => {
    it("accepts valid role change", () => {
      const change = {
        memberId: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin",
      };

      expect(changeOrganizationRoleSchema.safeParse(change).success).toBe(true);
    });

    it("accepts all valid organization roles", () => {
      const roles = ["owner", "admin", "producer", "associate_producer"];

      for (const role of roles) {
        const change = {
          memberId: "550e8400-e29b-41d4-a716-446655440000",
          role,
        };
        expect(changeOrganizationRoleSchema.safeParse(change).success).toBe(true);
      }
    });

    it("rejects invalid UUID for memberId", () => {
      const change = {
        memberId: "not-a-uuid",
        role: "admin",
      };

      const result = changeOrganizationRoleSchema.safeParse(change);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Valid member ID is required");
      }
    });

    it("rejects invalid organization role", () => {
      const change = {
        memberId: "550e8400-e29b-41d4-a716-446655440000",
        role: "director",
      };

      expect(changeOrganizationRoleSchema.safeParse(change).success).toBe(false);
    });

    it("rejects missing memberId", () => {
      const change = {
        role: "admin",
      };

      expect(changeOrganizationRoleSchema.safeParse(change).success).toBe(false);
    });

    it("rejects missing role", () => {
      const change = {
        memberId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(changeOrganizationRoleSchema.safeParse(change).success).toBe(false);
    });
  });

  describe("changeShowRoleSchema", () => {
    it("accepts valid role change", () => {
      const change = {
        memberId: "550e8400-e29b-41d4-a716-446655440000",
        role: "stage_manager",
      };

      expect(changeShowRoleSchema.safeParse(change).success).toBe(true);
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
        const change = {
          memberId: "550e8400-e29b-41d4-a716-446655440000",
          role,
        };
        expect(changeShowRoleSchema.safeParse(change).success).toBe(true);
      }
    });

    it("rejects invalid UUID for memberId", () => {
      const change = {
        memberId: "invalid",
        role: "director",
      };

      const result = changeShowRoleSchema.safeParse(change);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Valid member ID is required");
      }
    });

    it("rejects organization roles", () => {
      const change = {
        memberId: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin",
      };

      expect(changeShowRoleSchema.safeParse(change).success).toBe(false);
    });
  });

  describe("removeMemberSchema", () => {
    it("accepts valid member removal", () => {
      const removal = {
        memberId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(removeMemberSchema.safeParse(removal).success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const removal = {
        memberId: "not-valid",
      };

      const result = removeMemberSchema.safeParse(removal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Valid member ID is required");
      }
    });

    it("rejects missing memberId", () => {
      expect(removeMemberSchema.safeParse({}).success).toBe(false);
    });

    it("rejects empty memberId", () => {
      const removal = {
        memberId: "",
      };

      expect(removeMemberSchema.safeParse(removal).success).toBe(false);
    });
  });

  describe("resendInvitationSchema", () => {
    it("accepts valid invitation resend", () => {
      const resend = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(resendInvitationSchema.safeParse(resend).success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const resend = {
        invitationId: "invalid-id",
      };

      const result = resendInvitationSchema.safeParse(resend);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Valid invitation ID is required");
      }
    });

    it("rejects missing invitationId", () => {
      expect(resendInvitationSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("cancelInvitationSchema", () => {
    it("accepts valid invitation cancellation", () => {
      const cancel = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(cancelInvitationSchema.safeParse(cancel).success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const cancel = {
        invitationId: "not-a-uuid",
      };

      const result = cancelInvitationSchema.safeParse(cancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Valid invitation ID is required");
      }
    });

    it("rejects missing invitationId", () => {
      expect(cancelInvitationSchema.safeParse({}).success).toBe(false);
    });
  });
});
