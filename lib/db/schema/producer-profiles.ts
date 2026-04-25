import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const unionStatusEnum = pgEnum("union_status", [
  "union",
  "non_union",
  "union_signatory",
  "both",
]);

export const producerProfiles = pgTable(
  "producer_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    // Basic Info
    companyName: varchar("company_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    logoUrl: varchar("logo_url", { length: 500 }),
    description: text("description"),

    // Location & Contact
    location: varchar("location", { length: 200 }),
    website: varchar("website", { length: 255 }),

    // Union Status
    unionStatus: unionStatusEnum("union_status").default("both"),

    // Social Links
    socialLinks: jsonb("social_links").$type<{
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      facebook?: string;
      youtube?: string;
      vimeo?: string;
    }>(),

    // Visibility
    isPublic: boolean("is_public").default(true),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("producer_profiles_user_id_idx").on(table.userId),
    index("producer_profiles_slug_idx").on(table.slug),
    index("producer_profiles_is_public_idx").on(table.isPublic),
    index("producer_profiles_location_idx").on(table.location),
  ]
);

export type ProducerProfile = typeof producerProfiles.$inferSelect;
export type NewProducerProfile = typeof producerProfiles.$inferInsert;

export const UNION_STATUS_OPTIONS = [
  { value: "union", label: "Union Only" },
  { value: "non_union", label: "Non-Union Only" },
  { value: "union_signatory", label: "Union Signatory" },
  { value: "both", label: "Both Union & Non-Union" },
] as const;

export const UNION_STATUS_VALUES = ["union", "non_union", "union_signatory", "both"] as const;

// Relations
export const producerProfilesRelations = relations(producerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [producerProfiles.userId],
    references: [users.id],
  }),
}));
