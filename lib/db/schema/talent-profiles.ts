import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "non_binary",
  "other",
  "prefer_not_to_say",
]);

export const ethnicityEnum = pgEnum("ethnicity", [
  "asian",
  "black",
  "caucasian",
  "hispanic",
  "middle_eastern",
  "native_american",
  "pacific_islander",
  "south_asian",
  "mixed",
  "other",
  "prefer_not_to_say",
]);

export const hairColorEnum = pgEnum("hair_color", [
  "black",
  "brown",
  "blonde",
  "red",
  "auburn",
  "gray",
  "white",
  "bald",
  "other",
]);

export const eyeColorEnum = pgEnum("eye_color", [
  "brown",
  "blue",
  "green",
  "hazel",
  "gray",
  "amber",
  "other",
]);

export const vocalRangeEnum = pgEnum("vocal_range", [
  "soprano",
  "mezzo_soprano",
  "alto",
  "countertenor",
  "tenor",
  "baritone",
  "bass",
  "not_applicable",
]);

export const willingnessEnum = pgEnum("willingness", ["yes", "no", "negotiable"]);

export const talentProfiles = pgTable(
  "talent_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    // Basic Info
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    stageName: varchar("stage_name", { length: 100 }),
    pronouns: varchar("pronouns", { length: 50 }),
    bio: text("bio"),

    // Contact
    phone: varchar("phone", { length: 20 }),
    website: varchar("website", { length: 255 }),
    location: varchar("location", { length: 200 }),
    socialLinks: jsonb("social_links").$type<{
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      tiktok?: string;
      imdb?: string;
    }>(),

    // Physical Attributes (private, searchable by producers)
    heightInches: integer("height_inches"),
    hairColor: hairColorEnum("hair_color"),
    naturalHairColor: hairColorEnum("natural_hair_color"),
    eyeColor: eyeColorEnum("eye_color"),
    gender: genderEnum("gender"),
    ethnicity: ethnicityEnum("ethnicity"),
    ageRangeLow: integer("age_range_low"),
    ageRangeHigh: integer("age_range_high"),
    vocalRange: vocalRangeEnum("vocal_range"),
    willingnessToRemoveHair: willingnessEnum("willingness_to_remove_hair"),
    isOver18: boolean("is_over_18"),

    // Union Memberships (stored as array)
    unionMemberships: jsonb("union_memberships").$type<string[]>().default([]),

    // Visibility & Privacy
    isPublic: boolean("is_public").default(true),
    hideFromSearch: boolean("hide_from_search").default(false),
    publicProfileSlug: varchar("public_profile_slug", { length: 100 }).unique(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("talent_profiles_user_id_idx").on(table.userId),
    index("talent_profiles_public_slug_idx").on(table.publicProfileSlug),
    index("talent_profiles_search_visibility_idx").on(table.hideFromSearch, table.isPublic),
    index("talent_profiles_height_idx").on(table.heightInches),
    index("talent_profiles_age_range_idx").on(table.ageRangeLow, table.ageRangeHigh),
    index("talent_profiles_hair_color_idx").on(table.hairColor),
    index("talent_profiles_eye_color_idx").on(table.eyeColor),
    index("talent_profiles_ethnicity_idx").on(table.ethnicity),
    index("talent_profiles_vocal_range_idx").on(table.vocalRange),
  ]
);

export type TalentProfile = typeof talentProfiles.$inferSelect;
export type NewTalentProfile = typeof talentProfiles.$inferInsert;

export const HAIR_COLORS = [
  "black",
  "brown",
  "blonde",
  "red",
  "auburn",
  "gray",
  "white",
  "bald",
  "other",
] as const;

export const EYE_COLORS = ["brown", "blue", "green", "hazel", "gray", "amber", "other"] as const;

export const ETHNICITIES = [
  "asian",
  "black",
  "caucasian",
  "hispanic",
  "middle_eastern",
  "native_american",
  "pacific_islander",
  "south_asian",
  "mixed",
  "other",
  "prefer_not_to_say",
] as const;

export const VOCAL_RANGES = [
  "soprano",
  "mezzo_soprano",
  "alto",
  "countertenor",
  "tenor",
  "baritone",
  "bass",
  "not_applicable",
] as const;

export const WILLINGNESS_OPTIONS = ["yes", "no", "negotiable"] as const;

export const GENDERS = ["male", "female", "non_binary", "other", "prefer_not_to_say"] as const;
