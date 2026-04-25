import { z } from "zod";
import { ORGANIZATION_ROLE_VALUES, SHOW_ROLE_VALUES } from "@/lib/db/schema/permissions";

// Organization invitation schema
export const createOrganizationInvitationSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(ORGANIZATION_ROLE_VALUES, {
    required_error: "Role is required",
    invalid_type_error: "Invalid role",
  }),
});

// Show invitation schema
export const createShowInvitationSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(SHOW_ROLE_VALUES, {
    required_error: "Role is required",
    invalid_type_error: "Invalid role",
  }),
});

// Accept/decline invitation schema
export const respondToInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  accept: z.boolean(),
});

// Change role schema
export const changeOrganizationRoleSchema = z.object({
  memberId: z.string().uuid("Valid member ID is required"),
  role: z.enum(ORGANIZATION_ROLE_VALUES, {
    required_error: "Role is required",
    invalid_type_error: "Invalid role",
  }),
});

export const changeShowRoleSchema = z.object({
  memberId: z.string().uuid("Valid member ID is required"),
  role: z.enum(SHOW_ROLE_VALUES, {
    required_error: "Role is required",
    invalid_type_error: "Invalid role",
  }),
});

// Remove member schema
export const removeMemberSchema = z.object({
  memberId: z.string().uuid("Valid member ID is required"),
});

// Resend invitation schema
export const resendInvitationSchema = z.object({
  invitationId: z.string().uuid("Valid invitation ID is required"),
});

// Cancel invitation schema
export const cancelInvitationSchema = z.object({
  invitationId: z.string().uuid("Valid invitation ID is required"),
});

// Type exports
export type CreateOrganizationInvitation = z.infer<typeof createOrganizationInvitationSchema>;
export type CreateShowInvitation = z.infer<typeof createShowInvitationSchema>;
export type RespondToInvitation = z.infer<typeof respondToInvitationSchema>;
export type ChangeOrganizationRole = z.infer<typeof changeOrganizationRoleSchema>;
export type ChangeShowRole = z.infer<typeof changeShowRoleSchema>;
export type RemoveMember = z.infer<typeof removeMemberSchema>;
