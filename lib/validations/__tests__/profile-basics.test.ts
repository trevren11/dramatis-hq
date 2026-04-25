import { describe, it, expect } from "vitest";
import {
  profileBasicInfoSchema,
  profileContactSchema,
  profileUnionsSchema,
  publicSectionsSchema,
  profileVisibilitySchema,
  profileUpdateSchema,
} from "../profile";

describe("Profile Basic Schemas", () => {
  describe("profileBasicInfoSchema", () => {
    it("accepts valid basic info", () => {
      const info = {
        firstName: "Jane",
        lastName: "Doe",
      };

      const result = profileBasicInfoSchema.safeParse(info);
      expect(result.success).toBe(true);
    });

    it("accepts basic info with all fields", () => {
      const info = {
        firstName: "Jane",
        lastName: "Doe",
        stageName: "J.D. Star",
        pronouns: "she/her",
        bio: "Award-winning actress",
        location: "New York, NY",
      };

      const result = profileBasicInfoSchema.safeParse(info);
      expect(result.success).toBe(true);
    });

    it("rejects empty first name", () => {
      const info = {
        firstName: "",
        lastName: "Doe",
      };

      const result = profileBasicInfoSchema.safeParse(info);
      expect(result.success).toBe(false);
    });

    it("rejects empty last name", () => {
      const info = {
        firstName: "Jane",
        lastName: "",
      };

      const result = profileBasicInfoSchema.safeParse(info);
      expect(result.success).toBe(false);
    });

    it("rejects first name over 100 characters", () => {
      const info = {
        firstName: "a".repeat(101),
        lastName: "Doe",
      };

      const result = profileBasicInfoSchema.safeParse(info);
      expect(result.success).toBe(false);
    });

    it("rejects bio over 2000 characters", () => {
      const info = {
        firstName: "Jane",
        lastName: "Doe",
        bio: "a".repeat(2001),
      };

      const result = profileBasicInfoSchema.safeParse(info);
      expect(result.success).toBe(false);
    });

    it("accepts null for optional fields", () => {
      const info = {
        firstName: "Jane",
        lastName: "Doe",
        stageName: null,
        pronouns: null,
        bio: null,
        location: null,
      };

      const result = profileBasicInfoSchema.safeParse(info);
      expect(result.success).toBe(true);
    });
  });

  describe("profileContactSchema", () => {
    it("accepts valid contact info", () => {
      const contact = {
        phone: "555-1234",
        website: "https://janeactress.com",
      };

      const result = profileContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it("accepts empty website string", () => {
      const contact = {
        website: "",
      };

      const result = profileContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it("accepts social links", () => {
      const contact = {
        socialLinks: {
          instagram: "@janeactress",
          twitter: "@janeactress",
          linkedin: "janeactress",
          youtube: "janeactress",
          tiktok: "@janeactress",
          imdb: "nm1234567",
        },
      };

      const result = profileContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it("rejects invalid website URL", () => {
      const contact = {
        website: "not-a-url",
      };

      const result = profileContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });

    it("rejects website over 255 characters", () => {
      const contact = {
        website: "https://" + "a".repeat(250) + ".com",
      };

      const result = profileContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });

    it("accepts null for optional fields", () => {
      const contact = {
        phone: null,
        website: null,
        socialLinks: null,
      };

      const result = profileContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });
  });

  describe("profileUnionsSchema", () => {
    it("accepts valid union memberships", () => {
      const unions = {
        unionMemberships: ["sag-aftra", "aea"],
      };

      const result = profileUnionsSchema.safeParse(unions);
      expect(result.success).toBe(true);
    });

    it("defaults to empty array", () => {
      const unions = {};

      const result = profileUnionsSchema.safeParse(unions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unionMemberships).toEqual([]);
      }
    });
  });

  describe("publicSectionsSchema", () => {
    it("accepts valid public sections", () => {
      const sections = {
        basicInfo: true,
        bio: true,
        headshots: true,
        workHistory: false,
        education: false,
        skills: true,
        contact: false,
      };

      const result = publicSectionsSchema.safeParse(sections);
      expect(result.success).toBe(true);
    });

    it("defaults to expected values", () => {
      const result = publicSectionsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.basicInfo).toBe(true);
        expect(result.data.bio).toBe(true);
        expect(result.data.headshots).toBe(true);
        expect(result.data.workHistory).toBe(true);
        expect(result.data.education).toBe(true);
        expect(result.data.skills).toBe(true);
        expect(result.data.contact).toBe(false);
      }
    });
  });

  describe("profileVisibilitySchema", () => {
    it("accepts valid visibility settings", () => {
      const visibility = {
        isPublic: true,
        hideFromSearch: false,
        publicProfileSlug: "jane-doe",
      };

      const result = profileVisibilitySchema.safeParse(visibility);
      expect(result.success).toBe(true);
    });

    it("defaults isPublic to true", () => {
      const result = profileVisibilitySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
      }
    });

    it("defaults hideFromSearch to false", () => {
      const result = profileVisibilitySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hideFromSearch).toBe(false);
      }
    });

    it("rejects slug over 100 characters", () => {
      const visibility = {
        publicProfileSlug: "a".repeat(101),
      };

      const result = profileVisibilitySchema.safeParse(visibility);
      expect(result.success).toBe(false);
    });
  });

  describe("profileUpdateSchema", () => {
    it("accepts full profile update", () => {
      const update = {
        firstName: "Jane",
        lastName: "Doe",
        phone: "555-1234",
        unionMemberships: ["sag-aftra"],
        isPublic: true,
      };

      const result = profileUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("validates all nested schemas", () => {
      const update = {
        firstName: "",
        lastName: "Doe",
      };

      const result = profileUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });
});
