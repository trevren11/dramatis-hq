import { z } from "zod";
import { CASTING_STATUS_VALUES } from "@/lib/db/schema/casting";

export const castingAssignmentCreateSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  slotIndex: z.number().int().min(0).default(0),
  status: z.enum(CASTING_STATUS_VALUES).default("draft"),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional().nullable(),
});

export const castingAssignmentUpdateSchema = z.object({
  roleId: z.string().uuid("Invalid role ID").optional(),
  slotIndex: z.number().int().min(0).optional(),
  status: z.enum(CASTING_STATUS_VALUES).optional(),
  isLocked: z.boolean().optional(),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional().nullable(),
});

export const castingMoveSchema = z.object({
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  source: z.object({
    type: z.enum(["pool", "role", "deck"]),
    roleId: z.string().uuid().optional(),
    slotIndex: z.number().int().min(0).optional(),
  }),
  destination: z.object({
    type: z.enum(["pool", "role", "deck"]),
    roleId: z.string().uuid().optional(),
    slotIndex: z.number().int().min(0).optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const castingDeckAddSchema = z.object({
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional().nullable(),
});

export const castingDeckReorderSchema = z.object({
  items: z
    .array(
      z.object({
        talentProfileId: z.string().uuid("Invalid talent profile ID"),
        sortOrder: z.number().int().min(0),
      })
    )
    .min(1, "At least one item is required"),
});

export const castingPresenceUpdateSchema = z.object({
  cursorPosition: z.string().max(100).optional().nullable(),
  selectedTalentId: z.string().uuid().optional().nullable(),
});

export const castingBulkLockSchema = z.object({
  assignmentIds: z.array(z.string().uuid("Invalid assignment ID")).min(1),
  isLocked: z.boolean(),
});

export const castingBulkStatusSchema = z.object({
  assignmentIds: z.array(z.string().uuid("Invalid assignment ID")).min(1),
  status: z.enum(CASTING_STATUS_VALUES),
});

export type CastingAssignmentCreate = z.infer<typeof castingAssignmentCreateSchema>;
export type CastingAssignmentUpdate = z.infer<typeof castingAssignmentUpdateSchema>;
export type CastingMove = z.infer<typeof castingMoveSchema>;
export type CastingDeckAdd = z.infer<typeof castingDeckAddSchema>;
export type CastingDeckReorder = z.infer<typeof castingDeckReorderSchema>;
export type CastingPresenceUpdate = z.infer<typeof castingPresenceUpdateSchema>;
export type CastingBulkLock = z.infer<typeof castingBulkLockSchema>;
export type CastingBulkStatus = z.infer<typeof castingBulkStatusSchema>;
