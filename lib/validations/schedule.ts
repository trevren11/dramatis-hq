import { z } from "zod";
import { SCHEDULE_EVENT_TYPE_VALUES, SCHEDULE_EVENT_STATUS_VALUES } from "@/lib/db/schema/schedule";

export const scheduleEventCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
    description: z
      .string()
      .max(5000, "Description must be at most 5000 characters")
      .optional()
      .nullable(),
    eventType: z.enum(SCHEDULE_EVENT_TYPE_VALUES).default("rehearsal"),
    status: z.enum(SCHEDULE_EVENT_STATUS_VALUES).default("scheduled"),
    location: z.string().max(255, "Location must be at most 255 characters").optional().nullable(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    isAllCast: z.boolean().default(false),
    notes: z.string().max(5000, "Notes must be at most 5000 characters").optional().nullable(),
    castMemberIds: z.array(z.string().uuid("Invalid talent profile ID")).optional(),
    roleIds: z.array(z.string().uuid("Invalid role ID")).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const scheduleEventUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be at most 255 characters")
      .optional(),
    description: z
      .string()
      .max(5000, "Description must be at most 5000 characters")
      .optional()
      .nullable(),
    eventType: z.enum(SCHEDULE_EVENT_TYPE_VALUES).optional(),
    status: z.enum(SCHEDULE_EVENT_STATUS_VALUES).optional(),
    location: z.string().max(255, "Location must be at most 255 characters").optional().nullable(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    isAllCast: z.boolean().optional(),
    notes: z.string().max(5000, "Notes must be at most 5000 characters").optional().nullable(),
    castMemberIds: z.array(z.string().uuid("Invalid talent profile ID")).optional(),
    roleIds: z.array(z.string().uuid("Invalid role ID")).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const scheduleEventQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  eventType: z.enum(SCHEDULE_EVENT_TYPE_VALUES).optional(),
  status: z.enum(SCHEDULE_EVENT_STATUS_VALUES).optional(),
});

export const eventCastAddSchema = z.object({
  talentProfileIds: z.array(z.string().uuid("Invalid talent profile ID")).min(1),
  roleId: z.string().uuid("Invalid role ID").optional().nullable(),
});

export const eventCastRemoveSchema = z.object({
  talentProfileIds: z.array(z.string().uuid("Invalid talent profile ID")).min(1),
});

export const callSheetGenerateSchema = z.object({
  eventIds: z.array(z.string().uuid("Invalid event ID")).min(1),
  includeNotes: z.boolean().default(true),
  includeLocation: z.boolean().default(true),
});

export type ScheduleEventCreate = z.infer<typeof scheduleEventCreateSchema>;
export type ScheduleEventUpdate = z.infer<typeof scheduleEventUpdateSchema>;
export type ScheduleEventQuery = z.infer<typeof scheduleEventQuerySchema>;
export type EventCastAdd = z.infer<typeof eventCastAddSchema>;
export type EventCastRemove = z.infer<typeof eventCastRemoveSchema>;
export type CallSheetGenerate = z.infer<typeof callSheetGenerateSchema>;
