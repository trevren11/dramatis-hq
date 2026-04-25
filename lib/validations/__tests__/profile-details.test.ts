import { describe, it, expect } from "vitest";
import {
  workHistorySchema,
  educationSchema,
  skillSchema,
  talentSkillSchema,
  headshotCreateSchema,
  headshotUpdateSchema,
  addSkillByIdSchema,
  UNION_OPTIONS,
} from "../profile";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Profile Detail Schemas", () => {
  describe("workHistorySchema", () => {
    it("accepts valid work history", () => {
      const work = {
        showName: "Hamilton",
        role: "Aaron Burr",
        category: "theater" as const,
      };

      const result = workHistorySchema.safeParse(work);
      expect(result.success).toBe(true);
    });

    it("accepts all valid categories", () => {
      const categories = [
        "theater",
        "film",
        "television",
        "commercial",
        "web_series",
        "music_video",
        "voice_over",
        "industrial",
        "live_event",
        "other",
      ];

      for (const category of categories) {
        const work = { showName: "Show", role: "Role", category };
        expect(workHistorySchema.safeParse(work).success).toBe(true);
      }
    });

    it("accepts work history with all fields", () => {
      const work = {
        showName: "Hamilton",
        role: "Aaron Burr",
        category: "theater" as const,
        location: "Broadway, NYC",
        director: "Thomas Kail",
        productionCompany: "Lin-Manuel Miranda Productions",
        startDate: new Date("2016-01-01"),
        endDate: new Date("2018-01-01"),
        isUnion: true,
        description: "Originated the role",
        sortOrder: 1,
      };

      const result = workHistorySchema.safeParse(work);
      expect(result.success).toBe(true);
    });

    it("rejects empty show name", () => {
      const work = {
        showName: "",
        role: "Role",
        category: "theater" as const,
      };

      const result = workHistorySchema.safeParse(work);
      expect(result.success).toBe(false);
    });

    it("rejects empty role", () => {
      const work = {
        showName: "Show",
        role: "",
        category: "theater" as const,
      };

      const result = workHistorySchema.safeParse(work);
      expect(result.success).toBe(false);
    });

    it("rejects invalid category", () => {
      const work = {
        showName: "Show",
        role: "Role",
        category: "invalid",
      };

      const result = workHistorySchema.safeParse(work);
      expect(result.success).toBe(false);
    });

    it("defaults isUnion to false", () => {
      const work = {
        showName: "Show",
        role: "Role",
        category: "theater" as const,
      };

      const result = workHistorySchema.safeParse(work);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isUnion).toBe(false);
      }
    });

    it("defaults sortOrder to 0", () => {
      const work = {
        showName: "Show",
        role: "Role",
        category: "theater" as const,
      };

      const result = workHistorySchema.safeParse(work);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe(0);
      }
    });
  });

  describe("educationSchema", () => {
    it("accepts valid education", () => {
      const edu = {
        program: "BFA Acting",
        institution: "Juilliard",
      };

      const result = educationSchema.safeParse(edu);
      expect(result.success).toBe(true);
    });

    it("accepts education with all fields", () => {
      const edu = {
        program: "BFA Acting",
        degree: "Bachelor of Fine Arts",
        institution: "Juilliard",
        location: "New York, NY",
        startYear: 2010,
        endYear: 2014,
        description: "Studied classical theater",
        sortOrder: 1,
      };

      const result = educationSchema.safeParse(edu);
      expect(result.success).toBe(true);
    });

    it("rejects empty program", () => {
      const edu = {
        program: "",
        institution: "School",
      };

      const result = educationSchema.safeParse(edu);
      expect(result.success).toBe(false);
    });

    it("rejects empty institution", () => {
      const edu = {
        program: "Program",
        institution: "",
      };

      const result = educationSchema.safeParse(edu);
      expect(result.success).toBe(false);
    });

    it("rejects year before 1900", () => {
      const edu = {
        program: "Program",
        institution: "School",
        startYear: 1899,
      };

      const result = educationSchema.safeParse(edu);
      expect(result.success).toBe(false);
    });

    it("rejects year after 2100", () => {
      const edu = {
        program: "Program",
        institution: "School",
        endYear: 2101,
      };

      const result = educationSchema.safeParse(edu);
      expect(result.success).toBe(false);
    });
  });

  describe("skillSchema", () => {
    it("accepts valid skill", () => {
      const skill = {
        name: "Ballet",
        category: "dance" as const,
      };

      const result = skillSchema.safeParse(skill);
      expect(result.success).toBe(true);
    });

    it("accepts all valid categories", () => {
      const categories = [
        "dance",
        "music",
        "sports",
        "languages",
        "accents",
        "combat",
        "circus",
        "special",
        "other",
      ];

      for (const category of categories) {
        const skill = { name: "Skill", category };
        expect(skillSchema.safeParse(skill).success).toBe(true);
      }
    });

    it("rejects empty name", () => {
      const skill = {
        name: "",
        category: "dance" as const,
      };

      const result = skillSchema.safeParse(skill);
      expect(result.success).toBe(false);
    });

    it("rejects name over 100 characters", () => {
      const skill = {
        name: "a".repeat(101),
        category: "dance" as const,
      };

      const result = skillSchema.safeParse(skill);
      expect(result.success).toBe(false);
    });

    it("rejects invalid category", () => {
      const skill = {
        name: "Skill",
        category: "invalid",
      };

      const result = skillSchema.safeParse(skill);
      expect(result.success).toBe(false);
    });
  });

  describe("talentSkillSchema", () => {
    it("accepts valid talent skill", () => {
      const talentSkill = {
        skillId: validUUID,
      };

      const result = talentSkillSchema.safeParse(talentSkill);
      expect(result.success).toBe(true);
    });

    it("accepts talent skill with proficiency level", () => {
      const talentSkill = {
        skillId: validUUID,
        proficiencyLevel: "Expert",
      };

      const result = talentSkillSchema.safeParse(talentSkill);
      expect(result.success).toBe(true);
    });

    it("rejects invalid skill UUID", () => {
      const talentSkill = {
        skillId: "not-uuid",
      };

      const result = talentSkillSchema.safeParse(talentSkill);
      expect(result.success).toBe(false);
    });

    it("rejects proficiency level over 50 characters", () => {
      const talentSkill = {
        skillId: validUUID,
        proficiencyLevel: "a".repeat(51),
      };

      const result = talentSkillSchema.safeParse(talentSkill);
      expect(result.success).toBe(false);
    });
  });

  describe("headshotCreateSchema", () => {
    it("accepts valid headshot", () => {
      const headshot = {
        url: "https://example.com/headshot.jpg",
      };

      const result = headshotCreateSchema.safeParse(headshot);
      expect(result.success).toBe(true);
    });

    it("accepts headshot with all fields", () => {
      const headshot = {
        url: "https://example.com/headshot.jpg",
        thumbnailUrl: "https://example.com/headshot-thumb.jpg",
        originalFilename: "headshot.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024000,
        width: 800,
        height: 1200,
      };

      const result = headshotCreateSchema.safeParse(headshot);
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const headshot = {
        url: "not-a-url",
      };

      const result = headshotCreateSchema.safeParse(headshot);
      expect(result.success).toBe(false);
    });

    it("rejects URL over 500 characters", () => {
      const headshot = {
        url: "https://example.com/" + "a".repeat(490),
      };

      const result = headshotCreateSchema.safeParse(headshot);
      expect(result.success).toBe(false);
    });
  });

  describe("headshotUpdateSchema", () => {
    it("accepts isPrimary update", () => {
      const update = { isPrimary: true };
      expect(headshotUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts sortOrder update", () => {
      const update = { sortOrder: 5 };
      expect(headshotUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update", () => {
      expect(headshotUpdateSchema.safeParse({}).success).toBe(true);
    });
  });

  describe("addSkillByIdSchema", () => {
    it("accepts valid skill by ID", () => {
      const skill = {
        skillId: validUUID,
      };

      const result = addSkillByIdSchema.safeParse(skill);
      expect(result.success).toBe(true);
    });

    it("accepts skill with proficiency level", () => {
      const skill = {
        skillId: validUUID,
        proficiencyLevel: "Intermediate",
      };

      const result = addSkillByIdSchema.safeParse(skill);
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const skill = {
        skillId: "not-uuid",
      };

      const result = addSkillByIdSchema.safeParse(skill);
      expect(result.success).toBe(false);
    });
  });

  describe("UNION_OPTIONS", () => {
    it("contains expected union options", () => {
      const values = UNION_OPTIONS.map((o) => o.value);
      expect(values).toContain("aea");
      expect(values).toContain("sag-aftra");
      expect(values).toContain("afm");
      expect(values).toContain("non-union");
    });

    it("has labels for all options", () => {
      for (const option of UNION_OPTIONS) {
        expect(option.label).toBeDefined();
        expect(option.label.length).toBeGreaterThan(0);
      }
    });
  });
});
