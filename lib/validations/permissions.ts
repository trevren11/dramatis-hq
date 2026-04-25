import { z } from "zod";
import { ORGANIZATION_ROLE_VALUES, SHOW_ROLE_VALUES } from "@/lib/db/schema/permissions";

// Organization member schemas
export const createOrganizationInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(ORGANIZATION_ROLE_VALUES, {
    errorMap: () => ({ message: "Invalid organization role" }),
  }),
});

export const updateOrganizationMemberSchema = z.object({
  role: z.enum(ORGANIZATION_ROLE_VALUES, {
    errorMap: () => ({ message: "Invalid organization role" }),
  }),
});

// Show member schemas
export const createShowInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(SHOW_ROLE_VALUES, {
    errorMap: () => ({ message: "Invalid show role" }),
  }),
});

export const updateShowMemberSchema = z.object({
  role: z.enum(SHOW_ROLE_VALUES, {
    errorMap: () => ({ message: "Invalid show role" }),
  }),
  permissions: z.array(z.string()).optional(),
});

// Invitation response schema
export const invitationResponseSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

// Types
export type CreateOrganizationInvite = z.infer<typeof createOrganizationInviteSchema>;
export type UpdateOrganizationMember = z.infer<typeof updateOrganizationMemberSchema>;
export type CreateShowInvite = z.infer<typeof createShowInviteSchema>;
export type UpdateShowMember = z.infer<typeof updateShowMemberSchema>;
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;
