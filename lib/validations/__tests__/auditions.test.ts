import { describe, it, expect } from "vitest";
import {
  auditionCreateSchema,
  auditionUpdateSchema,
  auditionSearchSchema,
  applicationSubmitSchema,
  applicationUpdateSchema,
} from "../auditions";

describe("Audition Validation", () => {
  describe("auditionCreateSchema", () => {
    it("accepts valid audition with minimal fields", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Open Call for Hamilton",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(true);
    });

    it("accepts valid audition with all fields", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Open Call for Hamilton",
        description: "Looking for diverse cast members",
        slug: "hamilton-open-call",
        location: "New York, NY",
        isVirtual: false,
        auditionDates: [{ date: "2024-06-15", startTime: "10:00", endTime: "18:00" }],
        submissionDeadline: new Date("2024-06-01"),
        requirements: {
          unionStatus: "union" as const,
          ageRangeMin: 18,
          ageRangeMax: 45,
        },
        materials: {
          requireHeadshot: true,
          requireResume: true,
        },
        visibility: "public" as const,
        status: "draft" as const,
        roleIds: ["550e8400-e29b-41d4-a716-446655440001"],
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(true);
    });

    it("rejects audition without showId", () => {
      const audition = {
        title: "Test Audition",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });

    it("rejects audition without title", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });

    it("rejects title that is too long", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "a".repeat(256),
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });

    it("rejects invalid showId UUID", () => {
      const audition = {
        showId: "not-a-uuid",
        title: "Test Audition",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });

    it("accepts all valid visibility options", () => {
      const visibilities = ["public", "private", "unlisted"];

      for (const visibility of visibilities) {
        const audition = {
          showId: "550e8400-e29b-41d4-a716-446655440000",
          title: "Test",
          visibility,
        };
        expect(auditionCreateSchema.safeParse(audition).success).toBe(true);
      }
    });

    it("accepts all valid status options", () => {
      const statuses = ["draft", "open", "closed", "cancelled"];

      for (const status of statuses) {
        const audition = {
          showId: "550e8400-e29b-41d4-a716-446655440000",
          title: "Test",
          status,
        };
        expect(auditionCreateSchema.safeParse(audition).success).toBe(true);
      }
    });

    it("rejects age range max less than min", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        requirements: {
          ageRangeMin: 30,
          ageRangeMax: 20,
        },
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });

    it("defaults visibility to public", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe("public");
      }
    });

    it("defaults status to draft", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
      }
    });

    it("defaults isVirtual to false", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isVirtual).toBe(false);
      }
    });

    it("validates audition date format", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        auditionDates: [{ date: "2024-06-15", startTime: "10:00" }],
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        auditionDates: [{ date: "June 15, 2024", startTime: "10:00" }],
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format", () => {
      const audition = {
        showId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        auditionDates: [{ date: "2024-06-15", startTime: "10am" }],
      };

      const result = auditionCreateSchema.safeParse(audition);
      expect(result.success).toBe(false);
    });
  });

  describe("auditionUpdateSchema", () => {
    it("accepts partial updates", () => {
      const update = {
        description: "Updated description",
      };

      expect(auditionUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update object", () => {
      expect(auditionUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("validates title when provided", () => {
      const update = { title: "" };
      expect(auditionUpdateSchema.safeParse(update).success).toBe(false);
    });

    it("validates showId format when provided", () => {
      const update = { showId: "not-a-uuid" };
      expect(auditionUpdateSchema.safeParse(update).success).toBe(false);
    });
  });

  describe("auditionSearchSchema", () => {
    it("accepts empty search params", () => {
      const result = auditionSearchSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts valid search params", () => {
      const search = {
        search: "hamilton",
        location: "New York",
        unionStatus: "union" as const,
        dateFrom: new Date("2024-06-01"),
        dateTo: new Date("2024-12-31"),
        isVirtual: true,
        page: 1,
        limit: 20,
      };

      const result = auditionSearchSchema.safeParse(search);
      expect(result.success).toBe(true);
    });

    it("defaults page to 1", () => {
      const result = auditionSearchSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("defaults limit to 20", () => {
      const result = auditionSearchSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("rejects page less than 1", () => {
      const result = auditionSearchSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects limit greater than 100", () => {
      const result = auditionSearchSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it("coerces string page to number", () => {
      const result = auditionSearchSchema.safeParse({ page: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });
  });

  describe("applicationSubmitSchema", () => {
    it("accepts valid application", () => {
      const application = {
        auditionId: "550e8400-e29b-41d4-a716-446655440000",
        materials: {
          headshotId: "550e8400-e29b-41d4-a716-446655440001",
          resumeId: "550e8400-e29b-41d4-a716-446655440002",
        },
      };

      const result = applicationSubmitSchema.safeParse(application);
      expect(result.success).toBe(true);
    });

    it("accepts application with video and audio URLs", () => {
      const application = {
        auditionId: "550e8400-e29b-41d4-a716-446655440000",
        materials: {
          videoUrl: "https://youtube.com/watch?v=abc123",
          audioUrl: "https://soundcloud.com/artist/song",
        },
      };

      const result = applicationSubmitSchema.safeParse(application);
      expect(result.success).toBe(true);
    });

    it("rejects invalid auditionId", () => {
      const application = {
        auditionId: "not-a-uuid",
        materials: {},
      };

      const result = applicationSubmitSchema.safeParse(application);
      expect(result.success).toBe(false);
    });

    it("rejects invalid video URL format", () => {
      const application = {
        auditionId: "550e8400-e29b-41d4-a716-446655440000",
        materials: {
          videoUrl: "not-a-url",
        },
      };

      const result = applicationSubmitSchema.safeParse(application);
      expect(result.success).toBe(false);
    });

    it("accepts roleIds array", () => {
      const application = {
        auditionId: "550e8400-e29b-41d4-a716-446655440000",
        materials: {},
        roleIds: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
      };

      const result = applicationSubmitSchema.safeParse(application);
      expect(result.success).toBe(true);
    });
  });

  describe("applicationUpdateSchema", () => {
    it("accepts valid status updates", () => {
      const statuses = ["submitted", "reviewed", "callback", "rejected", "cast"];

      for (const status of statuses) {
        const update = { status };
        expect(applicationUpdateSchema.safeParse(update).success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const update = { status: "invalid_status" };
      expect(applicationUpdateSchema.safeParse(update).success).toBe(false);
    });

    it("accepts status with notes", () => {
      const update = {
        status: "reviewed" as const,
        notes: "Great audition, consider for callback",
      };

      const result = applicationUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("rejects notes that are too long", () => {
      const update = {
        status: "reviewed" as const,
        notes: "a".repeat(5001),
      };

      const result = applicationUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });
});
