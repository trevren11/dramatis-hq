import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { talentProfiles } from "./talent-profiles";

export const skillCategoryEnum = pgEnum("skill_category", [
  "dance",
  "music",
  "sports",
  "languages",
  "accents",
  "combat",
  "circus",
  "special",
  "other",
]);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    category: skillCategoryEnum("category").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("skills_name_idx").on(table.name),
    index("skills_category_idx").on(table.category),
  ]
);

export const talentSkills = pgTable(
  "talent_skills",
  {
    talentProfileId: uuid("talent_profile_id")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    skillId: uuid("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    proficiencyLevel: varchar("proficiency_level", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.talentProfileId, table.skillId] }),
    index("talent_skills_talent_profile_id_idx").on(table.talentProfileId),
    index("talent_skills_skill_id_idx").on(table.skillId),
  ]
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type TalentSkill = typeof talentSkills.$inferSelect;
export type NewTalentSkill = typeof talentSkills.$inferInsert;

export const SKILL_CATEGORIES = [
  "dance",
  "music",
  "sports",
  "languages",
  "accents",
  "combat",
  "circus",
  "special",
  "other",
] as const;

export const SKILL_CATEGORY_LABELS: Record<(typeof SKILL_CATEGORIES)[number], string> = {
  dance: "Dance",
  music: "Music & Instruments",
  sports: "Sports & Athletics",
  languages: "Languages",
  accents: "Accents & Dialects",
  combat: "Stage Combat",
  circus: "Circus & Acrobatics",
  special: "Special Skills",
  other: "Other",
};

export const COMMON_SKILLS: { name: string; category: (typeof SKILL_CATEGORIES)[number] }[] = [
  { name: "Ballet", category: "dance" },
  { name: "Jazz Dance", category: "dance" },
  { name: "Tap Dance", category: "dance" },
  { name: "Contemporary", category: "dance" },
  { name: "Hip Hop", category: "dance" },
  { name: "Ballroom", category: "dance" },
  { name: "Piano", category: "music" },
  { name: "Guitar", category: "music" },
  { name: "Violin", category: "music" },
  { name: "Drums", category: "music" },
  { name: "Sight Reading", category: "music" },
  { name: "Swimming", category: "sports" },
  { name: "Tennis", category: "sports" },
  { name: "Horseback Riding", category: "sports" },
  { name: "Yoga", category: "sports" },
  { name: "Spanish", category: "languages" },
  { name: "French", category: "languages" },
  { name: "German", category: "languages" },
  { name: "Italian", category: "languages" },
  { name: "British RP", category: "accents" },
  { name: "Southern American", category: "accents" },
  { name: "New York", category: "accents" },
  { name: "Irish", category: "accents" },
  { name: "Sword Fighting", category: "combat" },
  { name: "Hand-to-Hand Combat", category: "combat" },
  { name: "Firearms Handling", category: "combat" },
  { name: "Juggling", category: "circus" },
  { name: "Aerial Silks", category: "circus" },
  { name: "Stilt Walking", category: "circus" },
];
