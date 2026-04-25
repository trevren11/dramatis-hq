import { z } from "zod";
import { EMAIL_TYPE_VALUES, EMAIL_FREQUENCY_VALUES } from "@/lib/db/schema/emails";

// Email type validation
export const emailTypeSchema = z.enum(EMAIL_TYPE_VALUES);

// Email frequency validation
export const emailFrequencySchema = z.enum(EMAIL_FREQUENCY_VALUES);

// Update a single email preference
export const updateEmailPreferenceSchema = z.object({
  emailType: emailTypeSchema,
  enabled: z.boolean(),
  frequency: emailFrequencySchema.optional(),
});

// Update multiple email preferences at once
export const updateEmailPreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      emailType: emailTypeSchema,
      enabled: z.boolean(),
      frequency: emailFrequencySchema.optional(),
    })
  ),
});

// Get email preferences response
export const emailPreferenceResponseSchema = z.object({
  emailType: emailTypeSchema,
  enabled: z.boolean(),
  frequency: emailFrequencySchema,
  isCritical: z.boolean(),
});

// Unsubscribe request
export const unsubscribeRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// Unsubscribe by type (authenticated)
export const unsubscribeByTypeSchema = z.object({
  emailType: emailTypeSchema.optional(),
  unsubscribeAll: z.boolean().optional(),
});

// Resend webhook payload
export const resendWebhookSchema = z.object({
  type: z.enum([
    "email.sent",
    "email.delivered",
    "email.delivery_delayed",
    "email.complained",
    "email.bounced",
    "email.opened",
    "email.clicked",
  ]),
  created_at: z.string(),
  data: z.object({
    email_id: z.string(),
    from: z.string(),
    to: z.array(z.string()),
    subject: z.string(),
    created_at: z.string(),
    click: z
      .object({
        link: z.string(),
        timestamp: z.string(),
      })
      .optional(),
    bounce: z
      .object({
        message: z.string(),
      })
      .optional(),
  }),
});

// Send email request (internal use)
export const sendEmailRequestSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(500),
  html: z.string().optional(),
  text: z.string().optional(),
  type: emailTypeSchema,
  userId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  replyTo: z.string().email().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  scheduledAt: z.string().datetime().optional(),
});

// Email log query params
export const emailLogQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: emailTypeSchema.optional(),
  status: z
    .enum([
      "queued",
      "sending",
      "sent",
      "delivered",
      "opened",
      "clicked",
      "bounced",
      "complained",
      "failed",
    ])
    .optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// Type exports
export type UpdateEmailPreference = z.infer<typeof updateEmailPreferenceSchema>;
export type UpdateEmailPreferences = z.infer<typeof updateEmailPreferencesSchema>;
export type EmailPreferenceResponse = z.infer<typeof emailPreferenceResponseSchema>;
export type UnsubscribeRequest = z.infer<typeof unsubscribeRequestSchema>;
export type UnsubscribeByType = z.infer<typeof unsubscribeByTypeSchema>;
export type ResendWebhookPayload = z.infer<typeof resendWebhookSchema>;
export type SendEmailRequest = z.infer<typeof sendEmailRequestSchema>;
export type EmailLogQuery = z.infer<typeof emailLogQuerySchema>;
