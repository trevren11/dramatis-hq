import { z } from "zod";
import { SHOW_TYPE_VALUES, SHOW_STATUS_VALUES } from "@/lib/db/schema/shows";
import { ROLE_TYPE_VALUES } from "@/lib/db/schema/roles";
import { UNION_STATUS_VALUES } from "@/lib/db/schema/producer-profiles";

// Base show schema without refinements (for partial/extend)
const showBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  type: z.enum(SHOW_TYPE_VALUES).default("play"),
  description: z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .nullable(),
  venue: z.string().max(255, "Venue must be at most 255 characters").optional().nullable(),
  rehearsalStart: z.coerce.date().optional().nullable(),
  rehearsalEnd: z.coerce.date().optional().nullable(),
  performanceStart: z.coerce.date().optional().nullable(),
  performanceEnd: z.coerce.date().optional().nullable(),
  unionStatus: z.enum(UNION_STATUS_VALUES).default("both"),
  status: z.enum(SHOW_STATUS_VALUES).default("planning"),
  isPublic: z.boolean().default(true),
});

// Show validation schemas with refinements
export const showCreateSchema = showBaseSchema.refine(
  (data) => {
    if (data.performanceStart && data.performanceEnd) {
      return data.performanceEnd >= data.performanceStart;
    }
    return true;
  },
  {
    message: "Performance end date must be on or after performance start date",
    path: ["performanceEnd"],
  }
);

export const showUpdateSchema = showBaseSchema
  .partial()
  .extend({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be at most 255 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.performanceStart && data.performanceEnd) {
        return data.performanceEnd >= data.performanceStart;
      }
      return true;
    },
    {
      message: "Performance end date must be on or after performance start date",
      path: ["performanceEnd"],
    }
  );

// Base role schema without refinements (for partial/extend)
const roleBaseSchema = z.object({
  name: z.string().min(1, "Role name is required").max(255, "Name must be at most 255 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  type: z.enum(ROLE_TYPE_VALUES).default("supporting"),
  ageRangeMin: z.number().int().min(0).max(120).optional().nullable(),
  ageRangeMax: z.number().int().min(0).max(120).optional().nullable(),
  vocalRange: z
    .string()
    .max(100, "Vocal range must be at most 100 characters")
    .optional()
    .nullable(),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional().nullable(),
  positionCount: z.number().int().min(1, "Position count must be at least 1").default(1),
  sortOrder: z.number().int().default(0),
});

// Age range refinement function
const ageRangeRefinement = (data: {
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
}): boolean => {
  if (data.ageRangeMin != null && data.ageRangeMax != null) {
    return data.ageRangeMax >= data.ageRangeMin;
  }
  return true;
};

// Role validation schemas with refinements
export const roleCreateSchema = roleBaseSchema.refine(ageRangeRefinement, {
  message: "Age range max must be greater than or equal to age range min",
  path: ["ageRangeMax"],
});

export const roleUpdateSchema = roleBaseSchema
  .partial()
  .extend({
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must be at most 255 characters")
      .optional(),
  })
  .refine(ageRangeRefinement, {
    message: "Age range max must be greater than or equal to age range min",
    path: ["ageRangeMax"],
  });

export const roleBulkCreateSchema = z.object({
  roles: z
    .array(roleCreateSchema)
    .min(1, "At least one role is required")
    .max(50, "Maximum 50 roles per batch"),
});

export const roleBulkUpdateSchema = z.object({
  roles: z
    .array(
      z.object({
        id: z.string().uuid("Invalid role ID"),
        sortOrder: z.number().int(),
      })
    )
    .min(1, "At least one role is required"),
});

// Type exports
export type ShowCreate = z.infer<typeof showCreateSchema>;
export type ShowUpdate = z.infer<typeof showUpdateSchema>;
export type RoleCreate = z.infer<typeof roleCreateSchema>;
export type RoleUpdate = z.infer<typeof roleUpdateSchema>;
export type RoleBulkCreate = z.infer<typeof roleBulkCreateSchema>;
export type RoleBulkUpdate = z.infer<typeof roleBulkUpdateSchema>;
