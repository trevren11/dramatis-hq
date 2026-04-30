import { z } from "zod";
import { WORK_CATEGORIES } from "@/lib/db/schema/work-history";
import { SKILL_CATEGORIES } from "@/lib/db/schema/skills";
import {
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  WILLINGNESS_OPTIONS,
} from "@/lib/db/schema/talent-profiles";

export const profileBasicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  stageName: z.string().max(100).optional().nullable(),
  pronouns: z.string().max(50).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  birthday: z.coerce.date().optional().nullable(),
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

export const metricVisibilitySchema = z.object({
  height: z.boolean().default(true),
  weight: z.boolean().default(false),
  eyeColor: z.boolean().default(true),
  hairColor: z.boolean().default(true),
  ethnicity: z.boolean().default(false),
  willingnessToChangeHair: z.boolean().default(false),
});

export const profileMetricsSchema = z.object({
  heightInches: z.number().int().min(36).max(96).optional().nullable(),
  weightLbs: z.number().int().min(50).max(500).optional().nullable(),
  eyeColor: z.enum(EYE_COLORS).optional().nullable(),
  hairColor: z.enum(HAIR_COLORS).optional().nullable(),
  ethnicity: z.enum(ETHNICITIES).optional().nullable(),
  willingnessToChangeHair: z.enum(WILLINGNESS_OPTIONS).optional().nullable(),
  metricVisibility: metricVisibilitySchema.optional().nullable(),
});

// Full profile schema (for profile creation/wizard)
export const profileFullSchema = z.object({
  ...profileBasicInfoSchema.shape,
  ...profileContactSchema.shape,
  ...profileUnionsSchema.shape,
  ...profileVisibilitySchema.shape,
  ...profileMetricsSchema.shape,
});

// Partial profile schema (for updates - all fields optional)
export const profileUpdateSchema = profileFullSchema.partial();

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
export type ProfileMetrics = z.infer<typeof profileMetricsSchema>;
export type MetricVisibility = z.infer<typeof metricVisibilitySchema>;
export type ProfileFull = z.infer<typeof profileFullSchema>;
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

/**
 * Calculate age from birthday
 * @param birthday - Date of birth
 * @returns Age in years, or null if birthday is not provided
 */
export function calculateAge(birthday: Date | null | undefined): number | null {
  if (!birthday) return null;

  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if user is a minor (under 18) based on birthday
 * @param birthday - Date of birth
 * @returns true if under 18, false if 18+, null if birthday not provided
 */
export function isMinor(birthday: Date | null | undefined): boolean | null {
  const age = calculateAge(birthday);
  if (age === null) return null;
  return age < 18;
}
