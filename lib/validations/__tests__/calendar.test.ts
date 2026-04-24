import { describe, it, expect } from "vitest";
import {
  availabilitySchema,
  availabilityUpdateSchema,
  showScheduleSchema,
  showScheduleUpdateSchema,
  dateRangeQuerySchema,
} from "../calendar";

describe("Calendar Validation", () => {
  describe("availabilitySchema", () => {
    it("accepts valid availability data", () => {
      const data = {
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-20"),
        status: "available",
        isAllDay: true,
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts all availability statuses", () => {
      const statuses = ["available", "unavailable", "tentative"] as const;

      for (const status of statuses) {
        const data = {
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-01-20"),
          status,
        };
        const result = availabilitySchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("accepts optional title and notes", () => {
      const data = {
        title: "Vacation",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-20"),
        status: "unavailable",
        notes: "Family trip",
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects when end date is before start date", () => {
      const data = {
        startDate: new Date("2024-01-20"),
        endDate: new Date("2024-01-15"),
        status: "available",
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        expect(firstIssue).toBeDefined();
        if (firstIssue) {
          expect(firstIssue.path).toContain("endDate");
        }
      }
    });

    it("accepts same day for start and end date", () => {
      const date = new Date("2024-01-15");
      const data = {
        startDate: date,
        endDate: date,
        status: "available",
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts recurrence patterns", () => {
      const patterns = ["none", "daily", "weekly", "biweekly", "monthly"] as const;

      for (const pattern of patterns) {
        const data = {
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-01-20"),
          status: "available",
          recurrencePattern: pattern,
          recurrenceEndDate: pattern !== "none" ? new Date("2024-06-15") : undefined,
        };
        const result = availabilitySchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("requires recurrence end date for recurring events", () => {
      const data = {
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-20"),
        status: "available",
        recurrencePattern: "weekly",
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("coerces string dates to Date objects", () => {
      const data = {
        startDate: "2024-01-15",
        endDate: "2024-01-20",
        status: "available",
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });

    it("rejects invalid status", () => {
      const data = {
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-20"),
        status: "invalid",
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects title exceeding max length", () => {
      const data = {
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-20"),
        status: "available",
        title: "a".repeat(256),
      };

      const result = availabilitySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("availabilityUpdateSchema", () => {
    it("accepts partial updates", () => {
      const data = { status: "unavailable" };
      const result = availabilityUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const data = {};
      const result = availabilityUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts updating only title", () => {
      const data = { title: "Updated title" };
      const result = availabilityUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("showScheduleSchema", () => {
    it("accepts valid show schedule data", () => {
      const data = {
        showName: "Hamlet",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-03-31"),
        status: "confirmed",
      };

      const result = showScheduleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const data = {
        showName: "Hamlet",
        role: "Lead",
        venue: "Broadway Theater",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-03-31"),
        status: "confirmed",
        isPublic: true,
        showMetadata: {
          productionCompany: "ABC Productions",
          director: "Jane Doe",
        },
      };

      const result = showScheduleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("requires show name", () => {
      const data = {
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-03-31"),
        status: "confirmed",
      };

      const result = showScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects empty show name", () => {
      const data = {
        showName: "",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-03-31"),
        status: "confirmed",
      };

      const result = showScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("accepts all show statuses", () => {
      const statuses = ["confirmed", "tentative", "cancelled"] as const;

      for (const status of statuses) {
        const data = {
          showName: "Hamlet",
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-03-31"),
          status,
        };
        const result = showScheduleSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("rejects when end date is before start date", () => {
      const data = {
        showName: "Hamlet",
        startDate: new Date("2024-03-31"),
        endDate: new Date("2024-03-01"),
        status: "confirmed",
      };

      const result = showScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("showScheduleUpdateSchema", () => {
    it("accepts partial updates", () => {
      const data = { status: "cancelled" };
      const result = showScheduleUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts updating venue only", () => {
      const data = { venue: "New Theater" };
      const result = showScheduleUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("dateRangeQuerySchema", () => {
    it("accepts valid date range", () => {
      const data = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      const result = dateRangeQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const data = {};
      const result = dateRangeQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts only start date", () => {
      const data = { startDate: new Date("2024-01-01") };
      const result = dateRangeQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts only end date", () => {
      const data = { endDate: new Date("2024-12-31") };
      const result = dateRangeQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("coerces string dates", () => {
      const data = {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      const result = dateRangeQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });
  });
});
