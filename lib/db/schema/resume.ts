import { pgTable, uuid, varchar, timestamp, text, boolean, json, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const talentProfiles = pgTable(
  "talent_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    headshot: text("headshot"),
    contactEmail: varchar("contact_email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    height: varchar("height", { length: 20 }),
    hairColor: varchar("hair_color", { length: 50 }),
    eyeColor: varchar("eye_color", { length: 50 }),
    unionStatus: json("union_status").$type<string[]>().default([]),
    skills: json("skills").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("talent_profiles_user_id_idx").on(table.userId)]
);

export const workHistory = pgTable(
  "work_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    projectName: varchar("project_name", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }),
    director: varchar("director", { length: 255 }),
    year: varchar("year", { length: 10 }),
    isUnion: boolean("is_union").default(false),
    sortOrder: varchar("sort_order", { length: 10 }).default("0"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("work_history_profile_id_idx").on(table.profileId),
    index("work_history_category_idx").on(table.category),
  ]
);

export const education = pgTable(
  "education",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    program: varchar("program", { length: 255 }).notNull(),
    institution: varchar("institution", { length: 255 }).notNull(),
    instructor: varchar("instructor", { length: 255 }),
    yearStart: varchar("year_start", { length: 10 }),
    yearEnd: varchar("year_end", { length: 10 }),
    degree: varchar("degree", { length: 100 }),
    sortOrder: varchar("sort_order", { length: 10 }).default("0"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("education_profile_id_idx").on(table.profileId)]
);

export const resumeConfigurations = pgTable(
  "resume_configurations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    selectedWorkHistory: json("selected_work_history").$type<string[]>().default([]),
    selectedEducation: json("selected_education").$type<string[]>().default([]),
    selectedSkills: json("selected_skills").$type<string[]>().default([]),
    sectionOrder: json("section_order")
      .$type<string[]>()
      .default(["header", "theater", "film_television", "training", "skills"]),
    includeHeadshot: boolean("include_headshot").default(true),
    includeContact: boolean("include_contact").default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("resume_configurations_user_id_idx").on(table.userId)]
);

export type TalentProfileRecord = typeof talentProfiles.$inferSelect;
export type NewTalentProfile = typeof talentProfiles.$inferInsert;
export type WorkHistoryRecord = typeof workHistory.$inferSelect;
export type NewWorkHistory = typeof workHistory.$inferInsert;
export type EducationRecord = typeof education.$inferSelect;
export type NewEducation = typeof education.$inferInsert;
export type ResumeConfigurationRecord = typeof resumeConfigurations.$inferSelect;
export type NewResumeConfiguration = typeof resumeConfigurations.$inferInsert;
