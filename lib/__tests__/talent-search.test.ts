import { describe, it, expect } from "vitest";
import {
  calculateMatchPercentage,
  filterBySearchCriteria,
  sortByMatchPercentage,
} from "../validations/talent-search";
import type { TalentProfile } from "../db/schema/talent-profiles";
import type { TalentSearchInput } from "../validations/physical-attributes";

const createMockProfile = (overrides: Partial<TalentProfile> = {}): TalentProfile => ({
  id: "profile-123",
  userId: "user-123",
  firstName: "John",
  lastName: "Doe",
  stageName: null,
  pronouns: null,
  bio: null,
  phone: null,
  website: null,
  location: null,
  socialLinks: null,
  heightInches: 70,
  hairColor: "brown",
  naturalHairColor: "brown",
  eyeColor: "blue",
  gender: "male",
  ethnicity: "caucasian",
  ageRangeLow: 25,
  ageRangeHigh: 35,
  vocalRange: "tenor",
  willingnessToRemoveHair: "yes",
  isOver18: true,
  unionMemberships: [],
  isPublic: true,
  hideFromSearch: false,
  publicProfileSlug: "john-doe",
  publicSections: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("Talent Search", () => {
  describe("calculateMatchPercentage", () => {
    it("returns 100% when no filters are specified", () => {
      const profile = createMockProfile();
      const filters: TalentSearchInput = { page: 1, limit: 20, sortBy: "relevance" };

      expect(calculateMatchPercentage(profile, filters)).toBe(100);
    });

    it("returns 100% when all criteria match", () => {
      const profile = createMockProfile({
        heightInches: 70,
        hairColor: "brown",
        eyeColor: "blue",
        isOver18: true,
      });

      const filters: TalentSearchInput = {
        heightMin: 65,
        heightMax: 75,
        hairColors: ["brown"],
        eyeColors: ["blue"],
        mustBe18Plus: true,
        page: 1,
        limit: 20,
        sortBy: "relevance",
      };

      expect(calculateMatchPercentage(profile, filters)).toBe(100);
    });

    it("returns correct percentage for partial matches", () => {
      const profile = createMockProfile({
        heightInches: 70,
        hairColor: "brown",
        eyeColor: "blue",
        isOver18: true,
      });

      const filters: TalentSearchInput = {
        heightMin: 65,
        heightMax: 75,
        hairColors: ["blonde"],
        eyeColors: ["blue"],
        mustBe18Plus: true,
        page: 1,
        limit: 20,
        sortBy: "relevance",
      };

      expect(calculateMatchPercentage(profile, filters)).toBe(75);
    });

    it("handles height range correctly", () => {
      const profile = createMockProfile({ heightInches: 72 });

      expect(
        calculateMatchPercentage(profile, {
          heightMin: 70,
          heightMax: 74,
          page: 1,
          limit: 20,
          sortBy: "relevance",
        })
      ).toBe(100);

      expect(
        calculateMatchPercentage(profile, {
          heightMin: 74,
          heightMax: 78,
          page: 1,
          limit: 20,
          sortBy: "relevance",
        })
      ).toBe(0);
    });

    it("handles age range overlap correctly", () => {
      const profile = createMockProfile({ ageRangeLow: 25, ageRangeHigh: 35 });

      expect(
        calculateMatchPercentage(profile, {
          ageMin: 30,
          ageMax: 40,
          page: 1,
          limit: 20,
          sortBy: "relevance",
        })
      ).toBe(100);

      expect(
        calculateMatchPercentage(profile, {
          ageMin: 40,
          ageMax: 50,
          page: 1,
          limit: 20,
          sortBy: "relevance",
        })
      ).toBe(0);
    });

    it("handles multiple hair colors in filter", () => {
      const profile = createMockProfile({ hairColor: "brown" });

      expect(
        calculateMatchPercentage(profile, {
          hairColors: ["brown", "black"],
          page: 1,
          limit: 20,
          sortBy: "relevance",
        })
      ).toBe(100);

      expect(
        calculateMatchPercentage(profile, {
          hairColors: ["blonde", "red"],
          page: 1,
          limit: 20,
          sortBy: "relevance",
        })
      ).toBe(0);
    });

    it("handles willingness to cut hair filter", () => {
      const willingProfile = createMockProfile({ willingnessToRemoveHair: "yes" });
      const negotiableProfile = createMockProfile({ willingnessToRemoveHair: "negotiable" });
      const unwillingProfile = createMockProfile({ willingnessToRemoveHair: "no" });

      const filters: TalentSearchInput = {
        willingToCutHair: true,
        page: 1,
        limit: 20,
        sortBy: "relevance",
      };

      expect(calculateMatchPercentage(willingProfile, filters)).toBe(100);
      expect(calculateMatchPercentage(negotiableProfile, filters)).toBe(100);
      expect(calculateMatchPercentage(unwillingProfile, filters)).toBe(0);
    });

    it("handles 18+ filter", () => {
      const over18Profile = createMockProfile({ isOver18: true });
      const under18Profile = createMockProfile({ isOver18: false });
      const unknownProfile = createMockProfile({ isOver18: null });

      const filters: TalentSearchInput = {
        mustBe18Plus: true,
        page: 1,
        limit: 20,
        sortBy: "relevance",
      };

      expect(calculateMatchPercentage(over18Profile, filters)).toBe(100);
      expect(calculateMatchPercentage(under18Profile, filters)).toBe(0);
      expect(calculateMatchPercentage(unknownProfile, filters)).toBe(0);
    });

    it("handles null profile values", () => {
      const profile = createMockProfile({
        heightInches: null,
        hairColor: null,
      });

      const filters: TalentSearchInput = {
        heightMin: 65,
        heightMax: 75,
        hairColors: ["brown"],
        page: 1,
        limit: 20,
        sortBy: "relevance",
      };

      expect(calculateMatchPercentage(profile, filters)).toBe(0);
    });
  });

  describe("filterBySearchCriteria", () => {
    it("returns true when no strict criteria", () => {
      const profile = createMockProfile();
      const filters: TalentSearchInput = { page: 1, limit: 20, sortBy: "relevance" };

      expect(filterBySearchCriteria(profile, filters)).toBe(true);
    });

    it("filters out profiles not 18+ when required", () => {
      const over18Profile = createMockProfile({ isOver18: true });
      const under18Profile = createMockProfile({ isOver18: false });

      const filters: TalentSearchInput = {
        mustBe18Plus: true,
        page: 1,
        limit: 20,
        sortBy: "relevance",
      };

      expect(filterBySearchCriteria(over18Profile, filters)).toBe(true);
      expect(filterBySearchCriteria(under18Profile, filters)).toBe(false);
    });
  });

  describe("sortByMatchPercentage", () => {
    it("sorts results by match percentage descending", () => {
      const results = [
        { profile: createMockProfile({ id: "1" }), matchPercentage: 50 },
        { profile: createMockProfile({ id: "2" }), matchPercentage: 100 },
        { profile: createMockProfile({ id: "3" }), matchPercentage: 75 },
      ];

      const sorted = sortByMatchPercentage(results);

      expect(sorted[0]?.matchPercentage).toBe(100);
      expect(sorted[1]?.matchPercentage).toBe(75);
      expect(sorted[2]?.matchPercentage).toBe(50);
    });

    it("does not mutate the original array", () => {
      const results = [
        { profile: createMockProfile({ id: "1" }), matchPercentage: 50 },
        { profile: createMockProfile({ id: "2" }), matchPercentage: 100 },
      ];

      sortByMatchPercentage(results);

      expect(results[0]?.matchPercentage).toBe(50);
    });
  });
});
