import { z } from "zod";
import {
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  VOCAL_RANGES,
  GENDERS,
} from "@/lib/db/schema/talent-profiles";
import { UNION_STATUSES, EXPERIENCE_LEVELS, LIST_COLORS } from "@/lib/db/schema/talent-search";

const savedSearchFiltersSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  locationRadius: z.number().min(1).max(500).optional(),
  heightMin: z.number().min(36).max(96).optional(),
  heightMax: z.number().min(36).max(96).optional(),
  ageMin: z.number().min(0).max(100).optional(),
  ageMax: z.number().min(0).max(100).optional(),
  hairColors: z.array(z.enum(HAIR_COLORS)).optional(),
  eyeColors: z.array(z.enum(EYE_COLORS)).optional(),
  ethnicities: z.array(z.enum(ETHNICITIES)).optional(),
  vocalRanges: z.array(z.enum(VOCAL_RANGES)).optional(),
  genders: z.array(z.enum(GENDERS)).optional(),
  skills: z.array(z.string()).optional(),
  unionStatuses: z.array(z.enum(UNION_STATUSES)).optional(),
  willingToCutHair: z.boolean().optional(),
  mustBe18Plus: z.boolean().optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  experienceLevel: z.array(z.enum(EXPERIENCE_LEVELS)).optional(),
});

export const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: savedSearchFiltersSchema,
  sortOrder: z.enum(["relevance", "name_asc", "name_desc", "recent_activity"]).optional(),
  notifyOnMatch: z.boolean().optional(),
});

export type SavedSearchInput = z.infer<typeof savedSearchSchema>;

const listColorValues = LIST_COLORS.map((c) => c.value) as [string, ...string[]];

export const talentListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.enum(listColorValues).optional(),
  isShared: z.boolean().optional(),
});

export type TalentListInput = z.infer<typeof talentListSchema>;

export const talentListMemberSchema = z.object({
  talentProfileId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export type TalentListMemberInput = z.infer<typeof talentListMemberSchema>;

export const addMultipleMembersSchema = z.object({
  talentProfileIds: z.array(z.string().uuid()).min(1),
});

export type AddMultipleMembersInput = z.infer<typeof addMultipleMembersSchema>;
