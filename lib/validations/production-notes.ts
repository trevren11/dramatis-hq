import { z } from "zod";
import { DEPARTMENT_TYPE_VALUES, NOTE_ACCESS_LEVEL_VALUES } from "@/lib/db/schema/production-notes";

export const departmentCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(100, "Department name must be at most 100 characters"),
  type: z.enum(DEPARTMENT_TYPE_VALUES).default("custom"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional()
    .nullable(),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().default(0),
  headUserId: z.string().uuid("Invalid user ID").optional().nullable(),
});

export const departmentUpdateSchema = departmentCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const folderCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(255, "Folder name must be at most 255 characters"),
  parentFolderId: z.string().uuid("Invalid parent folder ID").optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const folderUpdateSchema = folderCreateSchema.partial();

export const noteCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Note title is required")
    .max(255, "Title must be at most 255 characters"),
  content: z.string().optional().nullable(),
  folderId: z.string().uuid("Invalid folder ID").optional().nullable(),
  templateType: z.string().max(50).optional().nullable(),
  isDraft: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  accessLevel: z.enum(NOTE_ACCESS_LEVEL_VALUES).default("department_member"),
});

export const noteUpdateSchema = noteCreateSchema.partial().extend({
  saveVersion: z.boolean().default(false),
  changesSummary: z.string().max(500).optional(),
});

export const noteAutoSaveSchema = z.object({
  content: z.string(),
  title: z.string().max(255).optional(),
});

export const commentCreateSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(5000, "Comment must be at most 5000 characters"),
  parentCommentId: z.string().uuid("Invalid parent comment ID").optional().nullable(),
  mentions: z.array(z.string().uuid()).optional().default([]),
});

export const commentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(5000, "Comment must be at most 5000 characters"),
});

export const commentResolveSchema = z.object({
  isResolved: z.boolean(),
});

export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  folderId: z.string().uuid("Invalid folder ID").optional().nullable(),
  noteId: z.string().uuid("Invalid note ID").optional().nullable(),
});

export const memberAddSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.string().max(100).optional().nullable(),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canManageFiles: z.boolean().default(false),
});

export const memberUpdateSchema = z.object({
  role: z.string().max(100).optional().nullable(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canManageFiles: z.boolean().optional(),
});

export const templateCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(255, "Template name must be at most 255 characters"),
  description: z.string().max(1000).optional().nullable(),
  content: z.string().min(1, "Template content is required"),
  departmentType: z.enum(DEPARTMENT_TYPE_VALUES).optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const templateUpdateSchema = templateCreateSchema.partial();

export const activityQuerySchema = z.object({
  departmentId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const bulkDepartmentReorderSchema = z.object({
  departments: z
    .array(
      z.object({
        id: z.string().uuid("Invalid department ID"),
        sortOrder: z.number().int(),
      })
    )
    .min(1, "At least one department is required"),
});

export const bulkNoteReorderSchema = z.object({
  notes: z
    .array(
      z.object({
        id: z.string().uuid("Invalid note ID"),
        sortOrder: z.number().int().optional(),
        folderId: z.string().uuid().optional().nullable(),
      })
    )
    .min(1, "At least one note is required"),
});

export const initializeDepartmentsSchema = z.object({
  departmentTypes: z.array(z.enum(DEPARTMENT_TYPE_VALUES)).min(1),
});

export type DepartmentCreate = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdate = z.infer<typeof departmentUpdateSchema>;
export type FolderCreate = z.infer<typeof folderCreateSchema>;
export type FolderUpdate = z.infer<typeof folderUpdateSchema>;
export type NoteCreate = z.infer<typeof noteCreateSchema>;
export type NoteUpdate = z.infer<typeof noteUpdateSchema>;
export type NoteAutoSave = z.infer<typeof noteAutoSaveSchema>;
export type CommentCreate = z.infer<typeof commentCreateSchema>;
export type CommentUpdate = z.infer<typeof commentUpdateSchema>;
export type CommentResolve = z.infer<typeof commentResolveSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type MemberAdd = z.infer<typeof memberAddSchema>;
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;
export type TemplateCreate = z.infer<typeof templateCreateSchema>;
export type TemplateUpdate = z.infer<typeof templateUpdateSchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type BulkDepartmentReorder = z.infer<typeof bulkDepartmentReorderSchema>;
export type BulkNoteReorder = z.infer<typeof bulkNoteReorderSchema>;
export type InitializeDepartments = z.infer<typeof initializeDepartmentsSchema>;
