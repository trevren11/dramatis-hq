import { z } from "zod";
import {
  AVAILABILITY_STATUSES,
  RECURRENCE_PATTERNS,
  SHOW_SCHEDULE_STATUSES,
} from "@/lib/db/schema/calendar";

export const availabilitySchema = z
  .object({
    title: z.string().max(255).optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.enum(AVAILABILITY_STATUSES).default("available"),
    isAllDay: z.boolean().default(true),
    notes: z.string().max(1000).optional().nullable(),
    recurrencePattern: z.enum(RECURRENCE_PATTERNS).default("none"),
    recurrenceEndDate: z.coerce.date().optional().nullable(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.recurrencePattern !== "none" && !data.recurrenceEndDate) {
        return false;
      }
      return true;
    },
    {
      message: "Recurrence end date is required for recurring events",
      path: ["recurrenceEndDate"],
    }
  );

export const availabilityUpdateSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(AVAILABILITY_STATUSES).optional(),
  isAllDay: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
  recurrencePattern: z.enum(RECURRENCE_PATTERNS).optional(),
  recurrenceEndDate: z.coerce.date().optional().nullable(),
});

export const showScheduleSchema = z
  .object({
    showName: z.string().min(1, "Show name is required").max(255),
    role: z.string().max(255).optional().nullable(),
    venue: z.string().max(255).optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.enum(SHOW_SCHEDULE_STATUSES).default("confirmed"),
    isPublic: z.boolean().default(false),
    showMetadata: z
      .object({
        productionCompany: z.string().optional(),
        director: z.string().optional(),
        castingDirector: z.string().optional(),
      })
      .optional()
      .nullable(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const showScheduleUpdateSchema = z.object({
  showName: z.string().min(1, "Show name is required").max(255).optional(),
  role: z.string().max(255).optional().nullable(),
  venue: z.string().max(255).optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(SHOW_SCHEDULE_STATUSES).optional(),
  isPublic: z.boolean().optional(),
  showMetadata: z
    .object({
      productionCompany: z.string().optional(),
      director: z.string().optional(),
      castingDirector: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export const dateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type AvailabilityUpdate = z.infer<typeof availabilityUpdateSchema>;
export type ShowScheduleInput = z.infer<typeof showScheduleSchema>;
export type ShowScheduleUpdate = z.infer<typeof showScheduleUpdateSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
