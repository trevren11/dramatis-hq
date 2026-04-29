import { z } from "zod";
import {
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  VOCAL_RANGES,
  WILLINGNESS_OPTIONS,
  GENDERS,
} from "@/lib/db/schema/talent-profiles";

export const physicalAttributesSchema = z
  .object({
    heightInches: z.number().min(36).max(96).nullable().optional(),
    hairColor: z.enum(HAIR_COLORS).nullable().optional(),
    naturalHairColor: z.enum(HAIR_COLORS).nullable().optional(),
    eyeColor: z.enum(EYE_COLORS).nullable().optional(),
    gender: z.enum(GENDERS).nullable().optional(),
    ethnicity: z.enum(ETHNICITIES).nullable().optional(),
    ageRangeLow: z.number().min(0).max(100).nullable().optional(),
    ageRangeHigh: z.number().min(0).max(100).nullable().optional(),
    vocalRange: z.enum(VOCAL_RANGES).nullable().optional(),
    willingnessToChangeHair: z.enum(WILLINGNESS_OPTIONS).nullable().optional(),
    isOver18: z.boolean().nullable().optional(),
    hideFromSearch: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.ageRangeLow != null && data.ageRangeHigh != null) {
        return data.ageRangeLow <= data.ageRangeHigh;
      }
      return true;
    },
    {
      message: "Minimum age must be less than or equal to maximum age",
      path: ["ageRangeLow"],
    }
  );

export type PhysicalAttributes = z.infer<typeof physicalAttributesSchema>;

export const talentSearchSchema = z.object({
  // Keyword search
  search: z.string().max(200).optional(),
  // Location
  location: z.string().max(200).optional(),
  locationRadius: z.number().min(1).max(500).optional(),
  // Physical attributes
  heightMin: z.number().min(36).max(96).optional(),
  heightMax: z.number().min(36).max(96).optional(),
  ageMin: z.number().min(0).max(100).optional(),
  ageMax: z.number().min(0).max(100).optional(),
  hairColors: z.array(z.enum(HAIR_COLORS)).optional(),
  eyeColors: z.array(z.enum(EYE_COLORS)).optional(),
  ethnicities: z.array(z.enum(ETHNICITIES)).optional(),
  vocalRanges: z.array(z.enum(VOCAL_RANGES)).optional(),
  genders: z.array(z.enum(GENDERS)).optional(),
  // Other filters
  willingToCutHair: z.boolean().optional(),
  mustBe18Plus: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  unionStatuses: z.array(z.string()).optional(),
  experienceLevel: z.array(z.string()).optional(),
  // Availability
  availableFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  availableTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  // Sorting
  sortBy: z.enum(["relevance", "name_asc", "name_desc", "recent_activity"]).default("relevance"),
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type TalentSearchInput = z.infer<typeof talentSearchSchema>;

// Saved search validation
export const savedSearchCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500).optional(),
  filters: talentSearchSchema.omit({ page: true, limit: true, sortBy: true }),
  sortOrder: z.enum(["relevance", "name_asc", "name_desc", "recent_activity"]).default("relevance"),
  notifyOnMatch: z.boolean().default(false),
});

export const savedSearchUpdateSchema = savedSearchCreateSchema.partial().extend({
  name: z.string().min(1).max(100).optional(),
});

export type SavedSearchCreate = z.infer<typeof savedSearchCreateSchema>;
export type SavedSearchUpdate = z.infer<typeof savedSearchUpdateSchema>;

// Talent list validation
export const talentListCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500).optional(),
  color: z.string().max(20).default("blue"),
  isShared: z.boolean().default(false),
});

export const talentListUpdateSchema = talentListCreateSchema.partial();

export const talentListMemberAddSchema = z.object({
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  notes: z.string().max(1000).optional(),
});

export const talentListMemberUpdateSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export type TalentListCreate = z.infer<typeof talentListCreateSchema>;
export type TalentListUpdate = z.infer<typeof talentListUpdateSchema>;
export type TalentListMemberAdd = z.infer<typeof talentListMemberAddSchema>;
export type TalentListMemberUpdate = z.infer<typeof talentListMemberUpdateSchema>;

export function heightToFeetInches(totalInches: number): { feet: number; inches: number } {
  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
}

export function feetInchesToHeight(feet: number, inches: number): number {
  return feet * 12 + inches;
}

export function heightToCm(inches: number): number {
  return Math.round(inches * 2.54);
}

export function cmToHeight(cm: number): number {
  return Math.round(cm / 2.54);
}
