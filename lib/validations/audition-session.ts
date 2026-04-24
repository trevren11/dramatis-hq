import { z } from "zod";
import { DECISION_TYPE_VALUES } from "@/lib/db/schema/auditions";

// Decision create schema
export const decisionCreateSchema = z.object({
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  decision: z.enum(DECISION_TYPE_VALUES),
  roleId: z.string().uuid("Invalid role ID").optional().nullable(),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional().nullable(),
});

// Validate roleId required for callback_role decision
export const decisionCreateWithRoleSchema = decisionCreateSchema.refine(
  (data) => {
    if (data.decision === "callback_role") {
      return data.roleId != null;
    }
    return true;
  },
  {
    message: "Role ID is required for callback_role decisions",
    path: ["roleId"],
  }
);

// Decision update schema
export const decisionUpdateSchema = z.object({
  decision: z.enum(DECISION_TYPE_VALUES).optional(),
  roleId: z.string().uuid("Invalid role ID").optional().nullable(),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional().nullable(),
});

// Decision update with role validation
export const decisionUpdateWithRoleSchema = decisionUpdateSchema.refine(
  (data) => {
    if (data.decision === "callback_role") {
      return data.roleId != null;
    }
    return true;
  },
  {
    message: "Role ID is required for callback_role decisions",
    path: ["roleId"],
  }
);

// Note create schema
export const noteCreateSchema = z.object({
  talentProfileId: z.string().uuid("Invalid talent profile ID"),
  note: z.string().min(1, "Note is required").max(10000, "Note must be at most 10000 characters"),
});

// Note update schema
export const noteUpdateSchema = z.object({
  note: z.string().min(1, "Note is required").max(10000, "Note must be at most 10000 characters"),
});

// Queue query params schema
export const queueQuerySchema = z.object({
  status: z.enum(["checked_in", "in_room", "completed", "all"]).optional().default("all"),
  decision: z
    .enum(["callback", "no_thanks", "callback_role", "undecided", "all"])
    .optional()
    .default("all"),
});

// Type exports
export type DecisionCreate = z.infer<typeof decisionCreateSchema>;
export type DecisionUpdate = z.infer<typeof decisionUpdateSchema>;
export type NoteCreate = z.infer<typeof noteCreateSchema>;
export type NoteUpdate = z.infer<typeof noteUpdateSchema>;
export type QueueQuery = z.infer<typeof queueQuerySchema>;
