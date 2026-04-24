import { describe, it, expect } from "vitest";
import { generateResumePdf, createSampleProfile } from "../generator";
import type { TalentProfile } from "../types";

describe("Resume Generator", () => {
  describe("createSampleProfile", () => {
    it("should return a valid sample profile", () => {
      const profile = createSampleProfile();

      expect(profile.id).toBeDefined();
      expect(profile.name).toBe("Jane Doe");
      expect(profile.workHistory.length).toBeGreaterThan(0);
      expect(profile.education.length).toBeGreaterThan(0);
      expect(profile.skills.length).toBeGreaterThan(0);
    });

    it("should have union status", () => {
      const profile = createSampleProfile();

      expect(profile.unionStatus).toContain("AEA");
      expect(profile.unionStatus).toContain("SAG-AFTRA");
    });

    it("should have physical attributes", () => {
      const profile = createSampleProfile();

      expect(profile.height).toBeDefined();
      expect(profile.hairColor).toBeDefined();
      expect(profile.eyeColor).toBeDefined();
    });
  });

  describe("generateResumePdf", () => {
    it("should generate a PDF buffer from sample profile", async () => {
      const profile = createSampleProfile();

      const result = await generateResumePdf({ profile });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.contentType).toBe("application/pdf");
      expect(result.filename).toBe("jane-doe-resume.pdf");
    });

    it("should generate PDF with custom filename based on profile name", async () => {
      const profile: TalentProfile = {
        ...createSampleProfile(),
        name: "John Smith",
      };

      const result = await generateResumePdf({ profile });

      expect(result.filename).toBe("john-smith-resume.pdf");
    });

    it("should filter work history by selected IDs", async () => {
      const profile = createSampleProfile();
      const [firstWorkHistory] = profile.workHistory;
      if (!firstWorkHistory) throw new Error("Expected work history item");
      const selectedIds = [firstWorkHistory.id];

      const result = await generateResumePdf({
        profile,
        selectedWorkHistoryIds: selectedIds,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it("should filter education by selected IDs", async () => {
      const profile = createSampleProfile();
      const [firstEducation] = profile.education;
      if (!firstEducation) throw new Error("Expected education item");
      const selectedIds = [firstEducation.id];

      const result = await generateResumePdf({
        profile,
        selectedEducationIds: selectedIds,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it("should filter skills by selected list", async () => {
      const profile = createSampleProfile();
      const [firstSkill, secondSkill] = profile.skills;
      if (!firstSkill || !secondSkill) throw new Error("Expected skill items");
      const selectedSkills = [firstSkill, secondSkill];

      const result = await generateResumePdf({
        profile,
        selectedSkills,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it("should handle empty selections", async () => {
      const profile = createSampleProfile();

      const result = await generateResumePdf({
        profile,
        selectedWorkHistoryIds: [],
        selectedEducationIds: [],
        selectedSkills: [],
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should respect config options", async () => {
      const profile = createSampleProfile();

      const result = await generateResumePdf({
        profile,
        config: {
          includeHeadshot: false,
          includeContact: false,
        },
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });
});
