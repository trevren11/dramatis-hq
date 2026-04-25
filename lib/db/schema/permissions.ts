import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { producerProfiles } from "./producer-profiles";
import { shows } from "./shows";

// Organization-level roles
export const organizationRoleEnum = pgEnum("organization_role", [
  "owner",
  "admin",
  "producer",
  "associate_producer",
]);

// Per-show roles
export const showRoleEnum = pgEnum("show_role", [
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
]);

export const invitationTypeEnum = pgEnum("invitation_type", ["organization", "show"]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

// Organization members - links users to organizations with roles
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: organizationRoleEnum("role").notNull().default("associate_producer"),
    invitedBy: uuid("invited_by").references(() => users.id, {
      onDelete: "set null",
    }),
    invitedAt: timestamp("invited_at", { mode: "date" }).defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("org_members_org_id_idx").on(table.organizationId),
    index("org_members_user_id_idx").on(table.userId),
    unique("org_members_org_user_unique").on(table.organizationId, table.userId),
  ]
);

// Show members - links users to specific shows with roles
export const showMembers = pgTable(
  "show_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: showRoleEnum("role").notNull(),
    // JSON override for custom permissions beyond the role defaults
    permissions: jsonb("permissions").$type<string[]>(),
    invitedBy: uuid("invited_by").references(() => users.id, {
      onDelete: "set null",
    }),
    invitedAt: timestamp("invited_at", { mode: "date" }).defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("show_members_show_id_idx").on(table.showId),
    index("show_members_user_id_idx").on(table.userId),
    unique("show_members_show_user_unique").on(table.showId, table.userId),
  ]
);

// Invitations - pending invites to org or show
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    type: invitationTypeEnum("type").notNull(),
    // For organization invites, this is the organizationId
    // For show invites, this is the showId
    targetId: uuid("target_id").notNull(),
    // Role to assign - stored as text since it could be org role or show role
    role: varchar("role", { length: 50 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    invitedBy: uuid("invited_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    invitedAt: timestamp("invited_at", { mode: "date" }).defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
    respondedBy: uuid("responded_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("invitations_email_idx").on(table.email),
    index("invitations_token_idx").on(table.token),
    index("invitations_target_id_idx").on(table.targetId),
    index("invitations_status_idx").on(table.status),
  ]
);

// Permission audit log - tracks all permission changes
export const permissionAuditLog = pgTable(
  "permission_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 50 }).notNull(), // e.g., 'role_changed', 'member_added', 'member_removed'
    targetType: varchar("target_type", { length: 20 }).notNull(), // 'organization' | 'show'
    targetId: uuid("target_id").notNull(),
    oldRole: varchar("old_role", { length: 50 }),
    newRole: varchar("new_role", { length: 50 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    performedBy: uuid("performed_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    performedAt: timestamp("performed_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_user_id_idx").on(table.userId),
    index("audit_log_target_idx").on(table.targetType, table.targetId),
    index("audit_log_performed_by_idx").on(table.performedBy),
    index("audit_log_performed_at_idx").on(table.performedAt),
  ]
);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type ShowMember = typeof showMembers.$inferSelect;
export type NewShowMember = typeof showMembers.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type PermissionAuditLog = typeof permissionAuditLog.$inferSelect;
export type NewPermissionAuditLog = typeof permissionAuditLog.$inferInsert;

// Role display names and descriptions
export const ORGANIZATION_ROLE_OPTIONS = [
  { value: "owner", label: "Owner", description: "Full access, billing, transfer ownership" },
  { value: "admin", label: "Admin", description: "Full access except billing" },
  { value: "producer", label: "Producer", description: "Create/manage shows" },
  {
    value: "associate_producer",
    label: "Associate Producer",
    description: "Limited edit access",
  },
] as const;

export const SHOW_ROLE_OPTIONS = [
  { value: "director", label: "Director", description: "Casting, notes, schedule, communication" },
  { value: "music_director", label: "Music Director", description: "Auditions, tracks, schedule" },
  {
    value: "choreographer",
    label: "Choreographer",
    description: "Auditions, choreography notes, schedule",
  },
  {
    value: "stage_manager",
    label: "Stage Manager",
    description: "Schedule, call sheets, notes, communication",
  },
  {
    value: "assistant_stage_manager",
    label: "Assistant Stage Manager",
    description: "Schedule, call sheets",
  },
  { value: "production_manager", label: "Production Manager", description: "Budget, schedule" },
  {
    value: "technical_director",
    label: "Technical Director",
    description: "Scenic, lighting notes, schedule",
  },
  { value: "lighting_designer", label: "Lighting Designer", description: "Lighting notes" },
  { value: "sound_designer", label: "Sound Designer", description: "Sound notes, tracks" },
  { value: "costume_designer", label: "Costume Designer", description: "Costume notes" },
  { value: "scenic_designer", label: "Scenic Designer", description: "Scenic notes" },
  { value: "props_master", label: "Props Master", description: "Props notes, props budget" },
  {
    value: "hair_makeup_designer",
    label: "Hair/Makeup Designer",
    description: "Hair/Makeup notes",
  },
  { value: "dramaturg", label: "Dramaturg", description: "Dramaturg notes, communication" },
  {
    value: "assistant_director",
    label: "Assistant Director",
    description: "AD notes, schedule view",
  },
  { value: "crew_member", label: "Crew Member", description: "Own schedule, own department notes" },
] as const;

export const ORGANIZATION_ROLE_VALUES = [
  "owner",
  "admin",
  "producer",
  "associate_producer",
] as const;
export const SHOW_ROLE_VALUES = [
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
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLE_VALUES)[number];
export type ShowRole = (typeof SHOW_ROLE_VALUES)[number];
