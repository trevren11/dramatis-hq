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
import { producerProfiles } from "./producer-profiles";
import { shows } from "./shows";
import { roles } from "./roles";
import { talentProfiles } from "./talent-profiles";
import { castingAssignments } from "./casting";
import { users } from "./users";

export const templateTypeEnum = pgEnum("template_type", [
  "cast_notification",
  "callback_notification",
  "rejection",
  "custom",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "draft",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "responded",
  "bounced",
  "failed",
]);

export const responseTypeEnum = pgEnum("response_type", ["accepted", "declined", "pending"]);

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    type: templateTypeEnum("type").default("custom").notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    mergeFields: jsonb("merge_fields")
      .$type<string[]>()
      .default([
        "talent_name",
        "talent_first_name",
        "role_name",
        "show_title",
        "organization_name",
        "response_deadline",
        "rehearsal_start",
        "performance_dates",
      ]),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("email_templates_org_id_idx").on(table.organizationId),
    index("email_templates_type_idx").on(table.type),
    index("email_templates_is_default_idx").on(table.isDefault),
  ]
);

export const castNotifications = pgTable(
  "cast_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    assignmentId: uuid("assignment_id")
      .references(() => castingAssignments.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),

    templateId: uuid("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    renderedBody: text("rendered_body"),

    status: notificationStatusEnum("status").default("draft").notNull(),
    sentAt: timestamp("sent_at", { mode: "date" }),
    deliveredAt: timestamp("delivered_at", { mode: "date" }),
    openedAt: timestamp("opened_at", { mode: "date" }),
    clickedAt: timestamp("clicked_at", { mode: "date" }),

    responseType: responseTypeEnum("response_type").default("pending").notNull(),
    respondedAt: timestamp("responded_at", { mode: "date" }),
    responseNote: text("response_note"),
    responseDeadline: timestamp("response_deadline", { mode: "date" }),

    reminderCount: varchar("reminder_count", { length: 10 }).default("0"),
    lastReminderAt: timestamp("last_reminder_at", { mode: "date" }),

    sentBy: uuid("sent_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("cast_notifications_show_id_idx").on(table.showId),
    index("cast_notifications_assignment_id_idx").on(table.assignmentId),
    index("cast_notifications_talent_id_idx").on(table.talentProfileId),
    index("cast_notifications_status_idx").on(table.status),
    index("cast_notifications_response_type_idx").on(table.responseType),
    index("cast_notifications_deadline_idx").on(table.responseDeadline),
    unique("cast_notifications_unique_assignment").on(table.assignmentId),
  ]
);

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
      .references(() => castNotifications.id, { onDelete: "cascade" })
      .notNull(),

    eventType: varchar("event_type", { length: 50 }).notNull(),
    eventData: jsonb("event_data").$type<Record<string, unknown>>(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("notification_events_notification_id_idx").on(table.notificationId),
    index("notification_events_type_idx").on(table.eventType),
    index("notification_events_created_at_idx").on(table.createdAt),
  ]
);

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type CastNotification = typeof castNotifications.$inferSelect;
export type NewCastNotification = typeof castNotifications.$inferInsert;
export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type NewNotificationEvent = typeof notificationEvents.$inferInsert;

export const TEMPLATE_TYPE_OPTIONS = [
  { value: "cast_notification", label: "Cast Notification" },
  { value: "callback_notification", label: "Callback Notification" },
  { value: "rejection", label: "Rejection" },
  { value: "custom", label: "Custom" },
] as const;

export const TEMPLATE_TYPE_VALUES = [
  "cast_notification",
  "callback_notification",
  "rejection",
  "custom",
] as const;

export const NOTIFICATION_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "opened", label: "Opened" },
  { value: "clicked", label: "Clicked" },
  { value: "responded", label: "Responded" },
  { value: "bounced", label: "Bounced" },
  { value: "failed", label: "Failed" },
] as const;

export const NOTIFICATION_STATUS_VALUES = [
  "draft",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "responded",
  "bounced",
  "failed",
] as const;

export const RESPONSE_TYPE_OPTIONS = [
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "pending", label: "Pending" },
] as const;

export const RESPONSE_TYPE_VALUES = ["accepted", "declined", "pending"] as const;

export const MERGE_FIELDS = [
  { field: "talent_name", label: "Talent Full Name", example: "John Smith" },
  { field: "talent_first_name", label: "Talent First Name", example: "John" },
  { field: "role_name", label: "Role Name", example: "Harold Hill" },
  { field: "show_title", label: "Show Title", example: "The Music Man" },
  { field: "organization_name", label: "Organization Name", example: "Broadway Theatre Co." },
  { field: "response_deadline", label: "Response Deadline", example: "January 15, 2025" },
  { field: "rehearsal_start", label: "Rehearsal Start Date", example: "February 1, 2025" },
  { field: "performance_dates", label: "Performance Dates", example: "March 1-15, 2025" },
  { field: "venue", label: "Venue", example: "Main Stage Theatre" },
  { field: "accept_link", label: "Accept Link", example: "[Generated automatically]" },
  { field: "decline_link", label: "Decline Link", example: "[Generated automatically]" },
] as const;

export const DEFAULT_TEMPLATES = {
  cast_notification: {
    name: "Cast Notification",
    subject: "Congratulations! You've been cast in {{show_title}}",
    body: `<p>Dear {{talent_first_name}},</p>

<p>We are thrilled to inform you that you have been cast as <strong>{{role_name}}</strong> in our upcoming production of <strong>{{show_title}}</strong>!</p>

<p>Rehearsals will begin on {{rehearsal_start}}, and performances are scheduled for {{performance_dates}} at {{venue}}.</p>

<p>Please confirm your acceptance by {{response_deadline}} using the link below:</p>

<p><a href="{{accept_link}}">Accept Role</a> | <a href="{{decline_link}}">Decline Role</a></p>

<p>If you have any questions, please don't hesitate to reach out.</p>

<p>Congratulations again, and we look forward to working with you!</p>

<p>Best regards,<br/>{{organization_name}}</p>`,
  },
  callback_notification: {
    name: "Callback Notification",
    subject: "Callback Invitation for {{show_title}}",
    body: `<p>Dear {{talent_first_name}},</p>

<p>Thank you for your audition for <strong>{{show_title}}</strong>. We are pleased to invite you to a callback!</p>

<p>We are considering you for the role of <strong>{{role_name}}</strong>.</p>

<p>Please confirm your attendance by {{response_deadline}}.</p>

<p><a href="{{accept_link}}">Confirm Attendance</a> | <a href="{{decline_link}}">Unable to Attend</a></p>

<p>Best regards,<br/>{{organization_name}}</p>`,
  },
  rejection: {
    name: "Rejection Letter",
    subject: "Thank you for auditioning for {{show_title}}",
    body: `<p>Dear {{talent_first_name}},</p>

<p>Thank you for auditioning for our production of <strong>{{show_title}}</strong>. We truly appreciate the time and effort you put into your audition.</p>

<p>After careful consideration, we regret to inform you that we will not be able to offer you a role in this production. This was an incredibly difficult decision given the high caliber of talent we saw.</p>

<p>We encourage you to audition for our future productions, and we hope to work with you in the future.</p>

<p>Thank you again for your interest in {{organization_name}}.</p>

<p>Best regards,<br/>{{organization_name}}</p>`,
  },
} as const;
