import { describe, it, expect } from "vitest";
import {
  workHistoryItemSchema,
  educationItemSchema,
  talentProfileSchema,
  resumeConfigurationSchema,
  generateResumeRequestSchema,
} from "../types";

describe("Resume Types", () => {
  describe("workHistoryItemSchema", () => {
    it("should validate a valid work history item", () => {
      const item = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        category: "theater",
        projectName: "Hamilton",
        role: "Eliza",
        company: "Broadway",
        director: "Thomas Kail",
        year: 2023,
        isUnion: true,
      };

      const result = workHistoryItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it("should reject invalid category", () => {
      const item = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        category: "invalid",
        projectName: "Test",
        role: "Lead",
      };

      const result = workHistoryItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("should require projectName and role", () => {
      const item = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        category: "theater",
      };

      const result = workHistoryItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe("educationItemSchema", () => {
    it("should validate a valid education item", () => {
      const item = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        program: "BFA Musical Theater",
        institution: "NYU Tisch",
        instructor: "John Smith",
        yearStart: 2014,
        yearEnd: 2018,
        degree: "BFA",
      };

      const result = educationItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it("should require program and institution", () => {
      const item = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = educationItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe("talentProfileSchema", () => {
    it("should validate a minimal valid profile", () => {
      const profile = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Jane Doe",
      };

      const result = talentProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("should apply defaults for arrays", () => {
      const profile = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Jane Doe",
      };

      const result = talentProfileSchema.parse(profile);
      expect(result.unionStatus).toEqual([]);
      expect(result.workHistory).toEqual([]);
      expect(result.education).toEqual([]);
      expect(result.skills).toEqual([]);
    });

    it("should validate email format", () => {
      const profile = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Jane Doe",
        contactEmail: "invalid-email",
      };

      const result = talentProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });
  });

  describe("resumeConfigurationSchema", () => {
    it("should validate a valid configuration", () => {
      const config = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Musical Theater Resume",
        selectedWorkHistory: [],
        selectedEducation: [],
        selectedSkills: [],
        sectionOrder: ["header", "theater", "training", "skills"],
        includeHeadshot: true,
        includeContact: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = resumeConfigurationSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should apply default section order", () => {
      const config = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Test Config",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = resumeConfigurationSchema.parse(config);
      expect(result.sectionOrder).toEqual([
        "header",
        "theater",
        "film_television",
        "training",
        "skills",
      ]);
    });
  });

  describe("generateResumeRequestSchema", () => {
    it("should validate a minimal request", () => {
      const request = {
        profileId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = generateResumeRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should validate a full request", () => {
      const request = {
        profileId: "550e8400-e29b-41d4-a716-446655440000",
        configurationId: "550e8400-e29b-41d4-a716-446655440001",
        selectedWorkHistory: ["550e8400-e29b-41d4-a716-446655440002"],
        selectedEducation: ["550e8400-e29b-41d4-a716-446655440003"],
        selectedSkills: ["Singing", "Dancing"],
        sectionOrder: ["header", "theater", "skills"],
        includeHeadshot: false,
        includeContact: true,
      };

      const result = generateResumeRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });
});
