import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const themeModeEnum = pgEnum("theme_mode", ["light", "dark", "system"]);

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    // Appearance
    theme: themeModeEnum("theme").default("system"),
    language: varchar("language", { length: 10 }).default("en"),
    timezone: varchar("timezone", { length: 100 }).default("UTC"),

    // Privacy
    activityVisible: boolean("activity_visible").default(true),

    // Security
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
    securityNotifications: boolean("security_notifications").default(true),

    // Blocked users stored as JSON array of user IDs
    blockedUserIds: jsonb("blocked_user_ids").$type<string[]>().default([]),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("user_settings_user_id_idx").on(table.userId)]
);

export const loginHistory = pgTable(
  "login_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    browser: varchar("browser", { length: 255 }),
    location: varchar("location", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    successful: boolean("successful").default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("login_history_user_id_idx").on(table.userId),
    index("login_history_created_at_idx").on(table.createdAt),
  ]
);

export const blockedUsers = pgTable(
  "blocked_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    blockedUserId: uuid("blocked_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("blocked_users_user_id_idx").on(table.userId),
    index("blocked_users_blocked_user_id_idx").on(table.blockedUserId),
  ]
);

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type LoginHistoryEntry = typeof loginHistory.$inferSelect;
export type BlockedUser = typeof blockedUsers.$inferSelect;
