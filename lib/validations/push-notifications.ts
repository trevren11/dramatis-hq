import { z } from "zod";
import { IN_APP_NOTIFICATION_TYPE_VALUES } from "@/lib/db/schema/push-notifications";

// Push subscription schemas
export const pushSubscriptionKeysSchema = z.object({
  p256dh: z.string().min(1, "p256dh key is required"),
  auth: z.string().min(1, "auth key is required"),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
  keys: pushSubscriptionKeysSchema,
  userAgent: z.string().optional(),
  deviceName: z.string().max(255).optional(),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
});

// In-app notification schemas
export const inAppNotificationCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  type: z.enum(IN_APP_NOTIFICATION_TYPE_VALUES),
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  body: z.string().min(1, "Body is required"),
  data: z
    .object({
      url: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const notificationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  unreadOnly: z.coerce.boolean().optional().default(false),
  types: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.array(z.enum(IN_APP_NOTIFICATION_TYPE_VALUES)))
    .optional(),
});

// Notification preferences schemas
export const notificationPreferencesUpdateSchema = z.object({
  pushEnabled: z.boolean().optional(),
  newMessage: z.boolean().optional(),
  scheduleChange: z.boolean().optional(),
  rehearsalReminder: z.boolean().optional(),
  callbackNotification: z.boolean().optional(),
  castDecision: z.boolean().optional(),
  documentShared: z.boolean().optional(),
  commentMention: z.boolean().optional(),
  auditionSubmission: z.boolean().optional(),
  systemAnnouncement: z.boolean().optional(),
  dndEnabled: z.boolean().optional(),
  dndStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .optional()
    .nullable(),
  dndEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .optional()
    .nullable(),
  timezone: z.string().max(100).optional(),
});

// Send push notification schema (for internal use)
export const sendPushNotificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  type: z.enum(IN_APP_NOTIFICATION_TYPE_VALUES),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  url: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export const sendBulkPushNotificationSchema = z.object({
  notifications: z.array(sendPushNotificationSchema).min(1, "At least one notification required"),
});

// Type exports
export type PushSubscriptionKeys = z.infer<typeof pushSubscriptionKeysSchema>;
export type PushSubscribe = z.infer<typeof pushSubscribeSchema>;
export type PushUnsubscribe = z.infer<typeof pushUnsubscribeSchema>;
export type InAppNotificationCreate = z.infer<typeof inAppNotificationCreateSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationPreferencesUpdate = z.infer<typeof notificationPreferencesUpdateSchema>;
export type SendPushNotification = z.infer<typeof sendPushNotificationSchema>;
export type SendBulkPushNotification = z.infer<typeof sendBulkPushNotificationSchema>;
