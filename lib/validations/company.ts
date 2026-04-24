import { z } from "zod";
import { UNION_STATUS_VALUES } from "@/lib/db/schema/producer-profiles";

// Slug validation: lowercase letters, numbers, and hyphens only
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const companySlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(100, "Slug must be at most 100 characters")
  .regex(slugRegex, "Slug must contain only lowercase letters, numbers, and hyphens");

export const companySocialLinksSchema = z.object({
  instagram: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  vimeo: z.string().url().optional().or(z.literal("")),
});

export const companyProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  slug: companySlugSchema,
  logoUrl: z.string().url().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  website: z.string().url().max(255).optional().nullable().or(z.literal("")),
  unionStatus: z.enum(UNION_STATUS_VALUES).optional().nullable(),
  socialLinks: companySocialLinksSchema.optional().nullable(),
  isPublic: z.boolean().default(true),
});

export const companyProfileUpdateSchema = companyProfileSchema.partial().extend({
  companyName: z.string().min(1, "Company name is required").max(255).optional(),
  slug: companySlugSchema.optional(),
});

export const productionPhotoCreateSchema = z.object({
  url: z.string().url().max(500),
  thumbnailUrl: z.string().url().max(500).optional().nullable(),
  originalFilename: z.string().max(255).optional().nullable(),
  mimeType: z.string().max(50).optional().nullable(),
  fileSize: z.number().int().positive().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  productionName: z.string().max(255).optional().nullable(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const productionPhotoUpdateSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  productionName: z.string().max(255).optional().nullable(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const productionPhotoBulkCreateSchema = z.object({
  photos: z.array(productionPhotoCreateSchema).max(20),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type CompanyProfileUpdate = z.infer<typeof companyProfileUpdateSchema>;
export type ProductionPhotoCreate = z.infer<typeof productionPhotoCreateSchema>;
export type ProductionPhotoUpdate = z.infer<typeof productionPhotoUpdateSchema>;
export type ProductionPhotoBulkCreate = z.infer<typeof productionPhotoBulkCreateSchema>;
