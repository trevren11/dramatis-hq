import { z } from "zod";
import {
  AUDITION_VISIBILITY_VALUES,
  AUDITION_STATUS_VALUES,
  APPLICATION_STATUS_VALUES,
} from "@/lib/db/schema/auditions";
import { UNION_STATUS_VALUES } from "@/lib/db/schema/producer-profiles";

// Audition date schema
const auditionDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .optional(),
  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
});

// Requirements schema
const auditionRequirementsSchema = z.object({
  unionStatus: z.enum(["union", "non_union", "both"]).optional(),
  ageRangeMin: z.number().int().min(0).max(120).optional(),
  ageRangeMax: z.number().int().min(0).max(120).optional(),
  gender: z.array(z.string()).optional(),
  ethnicities: z.array(z.string()).optional(),
  specialSkills: z.array(z.string()).optional(),
  other: z.string().max(2000, "Other requirements must be at most 2000 characters").optional(),
});

// Custom field schema for materials
const customFieldSchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
  type: z.enum(["text", "file", "url"]),
  required: z.boolean(),
});

// Materials schema
const auditionMaterialsSchema = z.object({
  requireHeadshot: z.boolean().optional(),
  requireResume: z.boolean().optional(),
  requireVideo: z.boolean().optional(),
  requireAudio: z.boolean().optional(),
  videoInstructions: z
    .string()
    .max(2000, "Video instructions must be at most 2000 characters")
    .optional(),
  audioInstructions: z
    .string()
    .max(2000, "Audio instructions must be at most 2000 characters")
    .optional(),
  additionalInstructions: z
    .string()
    .max(5000, "Additional instructions must be at most 5000 characters")
    .optional(),
  customFields: z.array(customFieldSchema).max(10, "Maximum 10 custom fields").optional(),
});

// Application materials schema
const applicationMaterialsSchema = z.object({
  headshotId: z.string().uuid().optional(),
  resumeId: z.string().uuid().optional(),
  videoUrl: z.string().url("Invalid video URL").optional(),
  audioUrl: z.string().url("Invalid audio URL").optional(),
  customResponses: z.record(z.string()).optional(),
});

// Slug validation
const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(255, "Slug must be at most 255 characters")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

// Base audition schema
const auditionBaseSchema = z.object({
  showId: z.string().uuid("Invalid show ID"),
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  description: z
    .string()
    .max(10000, "Description must be at most 10000 characters")
    .optional()
    .nullable(),
  slug: slugSchema.optional(), // Auto-generated if not provided
  location: z.string().max(255, "Location must be at most 255 characters").optional().nullable(),
  isVirtual: z.boolean().default(false),
  auditionDates: z.array(auditionDateSchema).default([]),
  submissionDeadline: z.coerce.date().optional().nullable(),
  requirements: auditionRequirementsSchema.default({}),
  materials: auditionMaterialsSchema.default({}),
  visibility: z.enum(AUDITION_VISIBILITY_VALUES).default("public"),
  publishAt: z.coerce.date().optional().nullable(),
  status: z.enum(AUDITION_STATUS_VALUES).default("draft"),
  roleIds: z.array(z.string().uuid()).optional(), // Roles to link
});

// Age range refinement
const ageRangeRefinement = (data: {
  requirements?: { ageRangeMin?: number; ageRangeMax?: number };
}): boolean => {
  if (data.requirements?.ageRangeMin != null && data.requirements.ageRangeMax != null) {
    return data.requirements.ageRangeMax >= data.requirements.ageRangeMin;
  }
  return true;
};

// Deadline refinement - deadline must be before first audition date
const deadlineRefinement = (data: {
  submissionDeadline?: Date | null;
  auditionDates?: { date: string }[];
}): boolean => {
  const firstDate = data.auditionDates?.[0];
  if (data.submissionDeadline && firstDate) {
    const firstAuditionDate = new Date(firstDate.date);
    return data.submissionDeadline <= firstAuditionDate;
  }
  return true;
};

// Create schema with refinements
export const auditionCreateSchema = auditionBaseSchema
  .refine(ageRangeRefinement, {
    message: "Age range max must be greater than or equal to age range min",
    path: ["requirements", "ageRangeMax"],
  })
  .refine(deadlineRefinement, {
    message: "Submission deadline must be before the first audition date",
    path: ["submissionDeadline"],
  });

// Update schema with refinements
export const auditionUpdateSchema = auditionBaseSchema
  .partial()
  .extend({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be at most 255 characters")
      .optional(),
  })
  .refine(ageRangeRefinement, {
    message: "Age range max must be greater than or equal to age range min",
    path: ["requirements", "ageRangeMax"],
  })
  .refine(deadlineRefinement, {
    message: "Submission deadline must be before the first audition date",
    path: ["submissionDeadline"],
  });

// Search/browse schema
export const auditionSearchSchema = z.object({
  search: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  unionStatus: z.enum(UNION_STATUS_VALUES).optional(),
  roleType: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  isVirtual: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Application submit schema
export const applicationSubmitSchema = z.object({
  auditionId: z.string().uuid("Invalid audition ID"),
  materials: applicationMaterialsSchema,
  roleIds: z.array(z.string().uuid()).optional(), // Which roles applying for
});

// Application update schema (for producers updating status)
export const applicationUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUS_VALUES),
  notes: z.string().max(5000, "Notes must be at most 5000 characters").optional().nullable(),
});

// Type exports
export type AuditionCreate = z.infer<typeof auditionCreateSchema>;
export type AuditionUpdate = z.infer<typeof auditionUpdateSchema>;
export type AuditionSearch = z.infer<typeof auditionSearchSchema>;
export type ApplicationSubmit = z.infer<typeof applicationSubmitSchema>;
export type ApplicationUpdate = z.infer<typeof applicationUpdateSchema>;
export type AuditionDateInput = z.infer<typeof auditionDateSchema>;
export type AuditionRequirementsInput = z.infer<typeof auditionRequirementsSchema>;
export type AuditionMaterialsInput = z.infer<typeof auditionMaterialsSchema>;
export type ApplicationMaterialsInput = z.infer<typeof applicationMaterialsSchema>;
