import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  jsonb,
  index,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { producerProfiles } from "./producer-profiles";
import { talentProfiles } from "./talent-profiles";
import { users } from "./users";

export const sortOrderEnum = pgEnum("talent_search_sort_order", [
  "relevance",
  "name_asc",
  "name_desc",
  "recent_activity",
]);

// Saved search filters type
export interface SavedSearchFilters {
  search?: string;
  location?: string;
  locationRadius?: number;
  heightMin?: number;
  heightMax?: number;
  ageMin?: number;
  ageMax?: number;
  hairColors?: string[];
  eyeColors?: string[];
  ethnicities?: string[];
  vocalRanges?: string[];
  genders?: string[];
  skills?: string[];
  unionStatuses?: string[];
  willingToCutHair?: boolean;
  mustBe18Plus?: boolean;
  availableFrom?: string;
  availableTo?: string;
  experienceLevel?: string[];
}

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    filters: jsonb("filters").$type<SavedSearchFilters>().notNull(),
    sortOrder: sortOrderEnum("sort_order").default("relevance"),
    notifyOnMatch: boolean("notify_on_match").default(false).notNull(),
    lastNotifiedAt: timestamp("last_notified_at", { mode: "date" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("saved_searches_organization_id_idx").on(table.organizationId),
    index("saved_searches_created_by_idx").on(table.createdBy),
    index("saved_searches_notify_on_match_idx").on(table.notifyOnMatch),
  ]
);

export const talentLists = pgTable(
  "talent_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 20 }).default("blue"),
    isShared: boolean("is_shared").default(false).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("talent_lists_organization_id_idx").on(table.organizationId),
    index("talent_lists_created_by_idx").on(table.createdBy),
    index("talent_lists_is_shared_idx").on(table.isShared),
  ]
);

export const talentListMembers = pgTable(
  "talent_list_members",
  {
    listId: uuid("list_id")
      .references(() => talentLists.id, { onDelete: "cascade" })
      .notNull(),
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    notes: text("notes"),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.talentProfileId] }),
    index("talent_list_members_list_id_idx").on(table.listId),
    index("talent_list_members_talent_profile_id_idx").on(table.talentProfileId),
  ]
);

export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type TalentList = typeof talentLists.$inferSelect;
export type NewTalentList = typeof talentLists.$inferInsert;
export type TalentListMember = typeof talentListMembers.$inferSelect;
export type NewTalentListMember = typeof talentListMembers.$inferInsert;

// Relations
export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  organization: one(producerProfiles, {
    fields: [savedSearches.organizationId],
    references: [producerProfiles.id],
  }),
  creator: one(users, {
    fields: [savedSearches.createdBy],
    references: [users.id],
  }),
}));

export const talentListsRelations = relations(talentLists, ({ one, many }) => ({
  organization: one(producerProfiles, {
    fields: [talentLists.organizationId],
    references: [producerProfiles.id],
  }),
  creator: one(users, {
    fields: [talentLists.createdBy],
    references: [users.id],
  }),
  members: many(talentListMembers),
}));

export const talentListMembersRelations = relations(talentListMembers, ({ one }) => ({
  list: one(talentLists, {
    fields: [talentListMembers.listId],
    references: [talentLists.id],
  }),
  talentProfile: one(talentProfiles, {
    fields: [talentListMembers.talentProfileId],
    references: [talentProfiles.id],
  }),
  addedByUser: one(users, {
    fields: [talentListMembers.addedBy],
    references: [users.id],
  }),
}));

export const UNION_STATUSES = ["AEA", "SAG-AFTRA", "EMC", "Non-Union"] as const;
export type UnionStatus = (typeof UNION_STATUSES)[number];

export const SORT_ORDER_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "recent_activity", label: "Recent Activity" },
] as const;

export const LIST_COLORS = [
  { value: "blue", label: "Blue", hex: "#3B82F6" },
  { value: "green", label: "Green", hex: "#22C55E" },
  { value: "purple", label: "Purple", hex: "#A855F7" },
  { value: "orange", label: "Orange", hex: "#F97316" },
  { value: "pink", label: "Pink", hex: "#EC4899" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "red", label: "Red", hex: "#EF4444" },
  { value: "gray", label: "Gray", hex: "#6B7280" },
] as const;

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced", "professional"] as const;

export const EXPERIENCE_LEVEL_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  professional: "Professional",
};
