import { z } from "zod";

// Script validations
export const scriptUploadSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  revisionNotes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const scriptUpdateSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  revisionNotes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const scriptSetActiveSchema = z.object({
  scriptId: z.string().uuid("Invalid script ID"),
});

// Minus track validations
export const minusTrackUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  act: z.string().max(50).optional().nullable(),
  scene: z.string().max(50).optional().nullable(),
  trackNumber: z.number().int().positive().optional().nullable(),
  originalKey: z.string().max(20).optional().nullable(),
  tempo: z.number().int().positive().max(300).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
});

export const minusTrackUpdateSchema = minusTrackUploadSchema.partial();

export const minusTrackReorderSchema = z.object({
  tracks: z
    .array(
      z.object({
        id: z.string().uuid("Invalid track ID"),
        sortOrder: z.number().int(),
      })
    )
    .min(1, "At least one track is required"),
});

export const minusTrackBulkUploadSchema = z.object({
  tracks: z.array(minusTrackUploadSchema).min(1, "At least one track is required"),
});

// Permission validations
export const materialPermissionCreateSchema = z
  .object({
    materialType: z.enum(["script", "track"]),
    materialId: z.string().uuid("Invalid material ID"),
    grantType: z.enum(["user", "role", "all_cast"]),
    grantedToUserId: z.string().uuid("Invalid user ID").optional().nullable(),
    grantedToRoleId: z.string().uuid("Invalid role ID").optional().nullable(),
    canDownload: z.boolean().default(false),
    canView: z.boolean().default(true),
    expiresAt: z.coerce.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.grantType === "user" && !data.grantedToUserId) {
        return false;
      }
      if (data.grantType === "role" && !data.grantedToRoleId) {
        return false;
      }
      return true;
    },
    {
      message: "User ID is required for user grants, Role ID is required for role grants",
    }
  );

export const materialPermissionUpdateSchema = z.object({
  canDownload: z.boolean().optional(),
  canView: z.boolean().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const materialPermissionBulkCreateSchema = z.object({
  materialType: z.enum(["script", "track"]),
  materialId: z.string().uuid("Invalid material ID"),
  permissions: z
    .array(
      z.object({
        grantType: z.enum(["user", "role", "all_cast"]),
        grantedToUserId: z.string().uuid().optional().nullable(),
        grantedToRoleId: z.string().uuid().optional().nullable(),
        canDownload: z.boolean().default(false),
        canView: z.boolean().default(true),
        expiresAt: z.coerce.date().optional().nullable(),
      })
    )
    .min(1, "At least one permission is required"),
});

export const materialPermissionRevokeSchema = z.object({
  permissionId: z.string().uuid("Invalid permission ID"),
});

// Sharing shortcuts
export const shareWithCastSchema = z.object({
  materialType: z.enum(["script", "track"]),
  materialId: z.string().uuid("Invalid material ID"),
  canDownload: z.boolean().default(false),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const shareWithRolesSchema = z.object({
  materialType: z.enum(["script", "track"]),
  materialId: z.string().uuid("Invalid material ID"),
  roleIds: z.array(z.string().uuid()).min(1, "At least one role is required"),
  canDownload: z.boolean().default(false),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const shareWithUsersSchema = z.object({
  materialType: z.enum(["script", "track"]),
  materialId: z.string().uuid("Invalid material ID"),
  userIds: z.array(z.string().uuid()).min(1, "At least one user is required"),
  canDownload: z.boolean().default(false),
  expiresAt: z.coerce.date().optional().nullable(),
});

// Access log query
export const materialAccessLogQuerySchema = z.object({
  materialType: z.enum(["script", "track"]).optional(),
  materialId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.enum(["view", "download", "stream"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Materials query
export const materialsQuerySchema = z.object({
  type: z.enum(["script", "track", "all"]).default("all"),
  showId: z.string().uuid("Invalid show ID"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Types
export type ScriptUpload = z.infer<typeof scriptUploadSchema>;
export type ScriptUpdate = z.infer<typeof scriptUpdateSchema>;
export type ScriptSetActive = z.infer<typeof scriptSetActiveSchema>;
export type MinusTrackUpload = z.infer<typeof minusTrackUploadSchema>;
export type MinusTrackUpdate = z.infer<typeof minusTrackUpdateSchema>;
export type MinusTrackReorder = z.infer<typeof minusTrackReorderSchema>;
export type MinusTrackBulkUpload = z.infer<typeof minusTrackBulkUploadSchema>;
export type MaterialPermissionCreate = z.infer<typeof materialPermissionCreateSchema>;
export type MaterialPermissionUpdate = z.infer<typeof materialPermissionUpdateSchema>;
export type MaterialPermissionBulkCreate = z.infer<typeof materialPermissionBulkCreateSchema>;
export type MaterialPermissionRevoke = z.infer<typeof materialPermissionRevokeSchema>;
export type ShareWithCast = z.infer<typeof shareWithCastSchema>;
export type ShareWithRoles = z.infer<typeof shareWithRolesSchema>;
export type ShareWithUsers = z.infer<typeof shareWithUsersSchema>;
export type MaterialAccessLogQuery = z.infer<typeof materialAccessLogQuerySchema>;
export type MaterialsQuery = z.infer<typeof materialsQuerySchema>;
