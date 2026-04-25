import { z } from "zod";
import { TEMPLATE_TYPE_VALUES } from "@/lib/db/schema/notifications";

export const emailTemplateCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(255, "Template name must be at most 255 characters"),
  type: z.enum(TEMPLATE_TYPE_VALUES).default("custom"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(500, "Subject must be at most 500 characters"),
  body: z.string().min(1, "Body is required"),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  mergeFields: z.array(z.string()).optional(),
});

export const emailTemplateUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(TEMPLATE_TYPE_VALUES).optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  mergeFields: z.array(z.string()).optional(),
});

export const castNotificationCreateSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  templateId: z.string().uuid("Invalid template ID").optional().nullable(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(500, "Subject must be at most 500 characters"),
  body: z.string().min(1, "Body is required"),
  responseDeadline: z.coerce.date().optional().nullable(),
});

export const castNotificationBatchSchema = z.object({
  assignmentIds: z
    .array(z.string().uuid("Invalid assignment ID"))
    .min(1, "At least one assignment is required"),
  templateId: z.string().uuid("Invalid template ID").optional().nullable(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(500, "Subject must be at most 500 characters"),
  body: z.string().min(1, "Body is required"),
  responseDeadline: z.coerce.date().optional().nullable(),
  sendImmediately: z.boolean().default(true),
});

export const notificationResponseSchema = z.object({
  responseType: z.enum(["accepted", "declined"]),
  responseNote: z.string().max(2000, "Note must be at most 2000 characters").optional().nullable(),
});

export const notificationReminderSchema = z.object({
  notificationIds: z.array(z.string().uuid("Invalid notification ID")).min(1),
  customSubject: z.string().max(500).optional(),
  customBody: z.string().optional(),
});

export const templatePreviewSchema = z.object({
  subject: z.string(),
  body: z.string(),
  sampleData: z
    .object({
      talent_name: z.string().optional(),
      talent_first_name: z.string().optional(),
      role_name: z.string().optional(),
      show_title: z.string().optional(),
      organization_name: z.string().optional(),
      response_deadline: z.string().optional(),
      rehearsal_start: z.string().optional(),
      performance_dates: z.string().optional(),
      venue: z.string().optional(),
    })
    .optional(),
});

export const castListExportSchema = z.object({
  format: z.enum(["pdf", "csv"]),
  includeContact: z.boolean().default(false),
  includeStatus: z.boolean().default(true),
  filterStatus: z.array(z.enum(["draft", "tentative", "confirmed", "declined"])).optional(),
  groupByRole: z.boolean().default(true),
});

export type EmailTemplateCreate = z.infer<typeof emailTemplateCreateSchema>;
export type EmailTemplateUpdate = z.infer<typeof emailTemplateUpdateSchema>;
export type CastNotificationCreate = z.infer<typeof castNotificationCreateSchema>;
export type CastNotificationBatch = z.infer<typeof castNotificationBatchSchema>;
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;
export type NotificationReminder = z.infer<typeof notificationReminderSchema>;
export type TemplatePreview = z.infer<typeof templatePreviewSchema>;
export type CastListExport = z.infer<typeof castListExportSchema>;
