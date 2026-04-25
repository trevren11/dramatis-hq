import { z } from "zod";
import { WORK_CATEGORIES } from "@/lib/db/schema/work-history";
import { SKILL_CATEGORIES } from "@/lib/db/schema/skills";

export const profileBasicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  stageName: z.string().max(100).optional().nullable(),
  pronouns: z.string().max(50).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
});

export const profileContactSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  website: z.string().url().max(255).optional().nullable().or(z.literal("")),
  socialLinks: z
    .object({
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
      tiktok: z.string().optional(),
      imdb: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export const profileUnionsSchema = z.object({
  unionMemberships: z.array(z.string()).default([]),
});

export const publicSectionsSchema = z.object({
  basicInfo: z.boolean().default(true),
  bio: z.boolean().default(true),
  headshots: z.boolean().default(true),
  videos: z.boolean().default(true),
  workHistory: z.boolean().default(true),
  education: z.boolean().default(true),
  skills: z.boolean().default(true),
  contact: z.boolean().default(false),
});

export const profileVisibilitySchema = z.object({
  isPublic: z.boolean().default(true),
  hideFromSearch: z.boolean().default(false),
  publicProfileSlug: z.string().max(100).optional().nullable(),
  publicSections: publicSectionsSchema.optional().nullable(),
});

export const profileUpdateSchema = z.object({
  ...profileBasicInfoSchema.shape,
  ...profileContactSchema.shape,
  ...profileUnionsSchema.shape,
  ...profileVisibilitySchema.shape,
});

export const workHistorySchema = z.object({
  showName: z.string().min(1, "Show name is required").max(255),
  role: z.string().min(1, "Role is required").max(255),
  category: z.enum(WORK_CATEGORIES),
  location: z.string().max(200).optional().nullable(),
  director: z.string().max(200).optional().nullable(),
  productionCompany: z.string().max(200).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isUnion: z.boolean().default(false),
  description: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const educationSchema = z.object({
  program: z.string().min(1, "Program name is required").max(255),
  degree: z.string().max(100).optional().nullable(),
  institution: z.string().min(1, "Institution is required").max(255),
  location: z.string().max(200).optional().nullable(),
  startYear: z.number().int().min(1900).max(2100).optional().nullable(),
  endYear: z.number().int().min(1900).max(2100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required").max(100),
  category: z.enum(SKILL_CATEGORIES),
});

export const talentSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiencyLevel: z.string().max(50).optional().nullable(),
});

export const headshotCreateSchema = z.object({
  url: z.string().url().max(500),
  thumbnailUrl: z.string().url().max(500).optional().nullable(),
  originalFilename: z.string().max(255).optional().nullable(),
  mimeType: z.string().max(50).optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  width: z.number().int().optional().nullable(),
  height: z.number().int().optional().nullable(),
});

export const headshotUpdateSchema = z.object({
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const addSkillByIdSchema = z.object({
  skillId: z.string().uuid(),
  proficiencyLevel: z.string().max(50).optional().nullable(),
});

export type ProfileBasicInfo = z.infer<typeof profileBasicInfoSchema>;
export type ProfileContact = z.infer<typeof profileContactSchema>;
export type ProfileUnions = z.infer<typeof profileUnionsSchema>;
export type ProfileVisibility = z.infer<typeof profileVisibilitySchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type WorkHistoryInput = z.infer<typeof workHistorySchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type TalentSkillInput = z.infer<typeof talentSkillSchema>;
export type HeadshotCreate = z.infer<typeof headshotCreateSchema>;
export type HeadshotUpdate = z.infer<typeof headshotUpdateSchema>;
export type AddSkillById = z.infer<typeof addSkillByIdSchema>;
export type PublicSectionsInput = z.infer<typeof publicSectionsSchema>;

export const UNION_OPTIONS = [
  { value: "aea", label: "AEA (Actors' Equity Association)" },
  { value: "sag-aftra", label: "SAG-AFTRA" },
  { value: "afm", label: "AFM (American Federation of Musicians)" },
  { value: "agma", label: "AGMA (American Guild of Musical Artists)" },
  { value: "agva", label: "AGVA (American Guild of Variety Artists)" },
  { value: "iatse", label: "IATSE" },
  { value: "non-union", label: "Non-Union" },
] as const;
