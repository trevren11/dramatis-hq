import { z } from "zod";
import { AUDITION_DECISION_VALUES, CALLBACK_STATUS_VALUES } from "@/lib/db/schema/callbacks";

// Time slot schema
const timeSlotSchema = z.object({
  id: z.string().min(1, "Slot ID is required"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  talentProfileId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

// Schedule date schema
const scheduleDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  slots: z.array(timeSlotSchema).default([]),
});

// Create callback session schema
export const callbackSessionCreateSchema = z.object({
  auditionId: z.string().uuid("Invalid audition ID"),
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  round: z.number().int().min(1, "Round must be at least 1").default(1),
  location: z.string().max(255).optional().nullable(),
  isVirtual: z.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
  scheduleDates: z.array(scheduleDateSchema).default([]),
  slotDurationMinutes: z.number().int().min(5).max(120).default(15),
  status: z.enum(CALLBACK_STATUS_VALUES).default("scheduled"),
});

// Update callback session schema
export const callbackSessionUpdateSchema = callbackSessionCreateSchema.partial().omit({
  auditionId: true,
});

// Callback invitation create schema
export const callbackInvitationCreateSchema = z.object({
  callbackSessionId: z.string().uuid("Invalid callback session ID"),
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  roleId: z.string().uuid().optional().nullable(),
  scheduledDate: z.coerce.date().optional().nullable(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .optional()
    .nullable(),
  timeSlotId: z.string().max(100).optional().nullable(),
});

// Bulk invitation create schema
export const callbackInvitationBulkCreateSchema = z.object({
  callbackSessionId: z.string().uuid("Invalid callback session ID"),
  invitations: z
    .array(
      z.object({
        talentProfileId: z.string().uuid("Invalid talent profile ID"),
        roleId: z.string().uuid().optional().nullable(),
        scheduledDate: z.coerce.date().optional().nullable(),
        scheduledTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "Invalid time format")
          .optional()
          .nullable(),
        timeSlotId: z.string().max(100).optional().nullable(),
      })
    )
    .min(1, "At least one invitation required"),
});

// Update callback invitation schema
export const callbackInvitationUpdateSchema = z.object({
  roleId: z.string().uuid().optional().nullable(),
  scheduledDate: z.coerce.date().optional().nullable(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional()
    .nullable(),
  timeSlotId: z.string().max(100).optional().nullable(),
  checkedInAt: z.coerce.date().optional().nullable(),
  queueNumber: z.number().int().optional().nullable(),
});

// Audition decision create schema
export const auditionDecisionCreateSchema = z.object({
  auditionId: z.string().uuid("Invalid audition ID"),
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  roleId: z.string().uuid().optional().nullable(),
  round: z.number().int().min(0, "Round must be at least 0").default(0),
  callbackSessionId: z.string().uuid().optional().nullable(),
  decision: z.enum(AUDITION_DECISION_VALUES),
  notes: z.string().max(5000).optional().nullable(),
});

// Update audition decision schema
export const auditionDecisionUpdateSchema = z.object({
  decision: z.enum(AUDITION_DECISION_VALUES).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

// Callback note create/update schema
export const callbackNoteSchema = z.object({
  callbackSessionId: z.string().uuid("Invalid callback session ID"),
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  roleId: z.string().uuid().optional().nullable(),
  content: z.string().max(10000, "Notes must be at most 10000 characters"),
});

// Bulk time slot generation schema
export const bulkTimeSlotGenerationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  slotDurationMinutes: z.number().int().min(5).max(120).default(15),
  breakDurationMinutes: z.number().int().min(0).max(60).default(0),
});

// Send callback emails schema
export const sendCallbackEmailsSchema = z.object({
  callbackSessionId: z.string().uuid("Invalid callback session ID"),
  invitationIds: z.array(z.string().uuid()).optional(), // If not provided, send to all
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Body is required").max(10000),
});

// Callback list query schema
export const callbackListQuerySchema = z.object({
  auditionId: z.string().uuid("Invalid audition ID"),
  roleId: z.string().uuid().optional(),
  round: z.coerce.number().int().min(0).optional(),
  status: z.enum(CALLBACK_STATUS_VALUES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(["name", "role", "scheduledTime", "createdAt"]).default("scheduledTime"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  groupByRole: z.coerce.boolean().default(false),
});

// Type exports
export type CallbackSessionCreate = z.infer<typeof callbackSessionCreateSchema>;
export type CallbackSessionUpdate = z.infer<typeof callbackSessionUpdateSchema>;
export type CallbackInvitationCreate = z.infer<typeof callbackInvitationCreateSchema>;
export type CallbackInvitationBulkCreate = z.infer<typeof callbackInvitationBulkCreateSchema>;
export type CallbackInvitationUpdate = z.infer<typeof callbackInvitationUpdateSchema>;
export type AuditionDecisionCreate = z.infer<typeof auditionDecisionCreateSchema>;
export type AuditionDecisionUpdate = z.infer<typeof auditionDecisionUpdateSchema>;
export type CallbackNoteInput = z.infer<typeof callbackNoteSchema>;
export type BulkTimeSlotGeneration = z.infer<typeof bulkTimeSlotGenerationSchema>;
export type SendCallbackEmails = z.infer<typeof sendCallbackEmailsSchema>;
export type CallbackListQuery = z.infer<typeof callbackListQuerySchema>;
