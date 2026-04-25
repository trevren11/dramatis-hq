import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  index,
  boolean,
  pgEnum,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Email types for categorization
export const emailTypeEnum = pgEnum("email_type", [
  // Auth emails
  "welcome",
  "email_verification",
  "password_reset",
  "login_notification",
  // Audition emails
  "audition_submission",
  "callback_notification",
  "cast_notification",
  "rejection_notification",
  // Production emails
  "schedule_update",
  "new_message",
  "document_shared",
  "rehearsal_reminder",
  // Account/Billing emails
  "subscription_confirmation",
  "payment_receipt",
  "payment_failed",
  "subscription_ending",
]);

// Email delivery status
export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "sending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
  "failed",
]);

// Email frequency preferences
export const emailFrequencyEnum = pgEnum("email_frequency", [
  "immediate",
  "daily",
  "weekly",
  "never",
]);

// Email log for tracking all sent emails
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    // Email details
    type: emailTypeEnum("type").notNull(),
    toEmail: varchar("to_email", { length: 255 }).notNull(),
    fromEmail: varchar("from_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),

    // Resend tracking
    resendId: varchar("resend_id", { length: 255 }),

    // Status tracking
    status: emailStatusEnum("status").default("queued").notNull(),

    // Timestamps for tracking
    queuedAt: timestamp("queued_at", { mode: "date" }).defaultNow().notNull(),
    sentAt: timestamp("sent_at", { mode: "date" }),
    deliveredAt: timestamp("delivered_at", { mode: "date" }),
    openedAt: timestamp("opened_at", { mode: "date" }),
    clickedAt: timestamp("clicked_at", { mode: "date" }),
    bouncedAt: timestamp("bounced_at", { mode: "date" }),
    failedAt: timestamp("failed_at", { mode: "date" }),

    // Error tracking
    error: text("error"),
    errorCode: varchar("error_code", { length: 50 }),

    // Metadata for debugging and analytics
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Retry tracking
    retryCount: varchar("retry_count", { length: 10 }).default("0"),
    lastRetryAt: timestamp("last_retry_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("email_logs_user_id_idx").on(table.userId),
    index("email_logs_type_idx").on(table.type),
    index("email_logs_status_idx").on(table.status),
    index("email_logs_resend_id_idx").on(table.resendId),
    index("email_logs_to_email_idx").on(table.toEmail),
    index("email_logs_created_at_idx").on(table.createdAt),
  ]
);

// User email preferences
export const emailPreferences = pgTable(
  "email_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Preference per email type
    emailType: emailTypeEnum("email_type").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    frequency: emailFrequencyEnum("frequency").default("immediate").notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("email_preferences_user_id_idx").on(table.userId),
    index("email_preferences_type_idx").on(table.emailType),
    unique("email_preferences_user_type_unique").on(table.userId, table.emailType),
  ]
);

// Unsubscribe tokens for one-click unsubscribe
export const emailUnsubscribeTokens = pgTable(
  "email_unsubscribe_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    token: varchar("token", { length: 255 }).notNull().unique(),
    emailType: emailTypeEnum("email_type"),

    // If null, unsubscribes from all non-critical emails
    usedAt: timestamp("used_at", { mode: "date" }),

    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("email_unsubscribe_tokens_user_id_idx").on(table.userId),
    index("email_unsubscribe_tokens_token_idx").on(table.token),
  ]
);

// Type exports
export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
export type EmailPreference = typeof emailPreferences.$inferSelect;
export type NewEmailPreference = typeof emailPreferences.$inferInsert;
export type EmailUnsubscribeToken = typeof emailUnsubscribeTokens.$inferSelect;
export type NewEmailUnsubscribeToken = typeof emailUnsubscribeTokens.$inferInsert;

// Email type values for use in code
export const EMAIL_TYPE_VALUES = [
  "welcome",
  "email_verification",
  "password_reset",
  "login_notification",
  "audition_submission",
  "callback_notification",
  "cast_notification",
  "rejection_notification",
  "schedule_update",
  "new_message",
  "document_shared",
  "rehearsal_reminder",
  "subscription_confirmation",
  "payment_receipt",
  "payment_failed",
  "subscription_ending",
] as const;

export type EmailType = (typeof EMAIL_TYPE_VALUES)[number];

export const EMAIL_STATUS_VALUES = [
  "queued",
  "sending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
  "failed",
] as const;

export type EmailStatus = (typeof EMAIL_STATUS_VALUES)[number];

export const EMAIL_FREQUENCY_VALUES = ["immediate", "daily", "weekly", "never"] as const;

export type EmailFrequency = (typeof EMAIL_FREQUENCY_VALUES)[number];

// Email types that are critical and cannot be disabled
export const CRITICAL_EMAIL_TYPES: EmailType[] = [
  "email_verification",
  "password_reset",
  "payment_failed",
];

// Categorized email types for preferences UI
export const EMAIL_TYPE_CATEGORIES = {
  auth: {
    label: "Authentication",
    types: ["welcome", "email_verification", "password_reset", "login_notification"],
  },
  auditions: {
    label: "Auditions",
    types: [
      "audition_submission",
      "callback_notification",
      "cast_notification",
      "rejection_notification",
    ],
  },
  production: {
    label: "Production",
    types: ["schedule_update", "new_message", "document_shared", "rehearsal_reminder"],
  },
  billing: {
    label: "Billing",
    types: [
      "subscription_confirmation",
      "payment_receipt",
      "payment_failed",
      "subscription_ending",
    ],
  },
} as const;

// Human-readable labels for email types
export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  welcome: "Welcome Email",
  email_verification: "Email Verification",
  password_reset: "Password Reset",
  login_notification: "Login Notification",
  audition_submission: "Audition Submission Confirmation",
  callback_notification: "Callback Notification",
  cast_notification: "Cast Notification",
  rejection_notification: "Rejection Notification",
  schedule_update: "Schedule Updates",
  new_message: "New Message Notification",
  document_shared: "Document Shared",
  rehearsal_reminder: "Rehearsal Reminders",
  subscription_confirmation: "Subscription Confirmation",
  payment_receipt: "Payment Receipt",
  payment_failed: "Payment Failed Warning",
  subscription_ending: "Subscription Ending Reminder",
};
