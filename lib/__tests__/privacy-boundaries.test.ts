import { describe, it, expect } from "vitest";
import {
  getViewerType,
  canViewPhysicalAttributes,
  canEditPhysicalAttributes,
  canSearchTalent,
  isProfileSearchable,
  stripPhysicalAttributes,
  getVisibleProfile,
} from "../validations/privacy";
import type { User } from "../db/schema/users";
import type { TalentProfile } from "../db/schema/talent-profiles";

const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  email: "test@example.com",
  emailVerified: null,
  passwordHash: null,
  userType: "talent",
  name: "Test User",
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

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
  willingnessToRemoveHair: "negotiable",
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

describe("Privacy Boundaries", () => {
  describe("getViewerType", () => {
    it("returns 'public' for null viewer", () => {
      expect(getViewerType(null, "user-123")).toBe("public");
    });

    it("returns 'owner' when viewer is the profile owner", () => {
      const viewer = createMockUser({ id: "user-123" });
      expect(getViewerType(viewer, "user-123")).toBe("owner");
    });

    it("returns 'producer' for producer users", () => {
      const viewer = createMockUser({ id: "other-user", userType: "producer" });
      expect(getViewerType(viewer, "user-123")).toBe("producer");
    });

    it("returns 'producer' for admin users", () => {
      const viewer = createMockUser({ id: "admin-user", userType: "admin" });
      expect(getViewerType(viewer, "user-123")).toBe("producer");
    });

    it("returns 'public' for other talent users", () => {
      const viewer = createMockUser({ id: "other-talent", userType: "talent" });
      expect(getViewerType(viewer, "user-123")).toBe("public");
    });
  });

  describe("canViewPhysicalAttributes", () => {
    it("owner can always view physical attributes", () => {
      const profile = createMockProfile({ hideFromSearch: true });
      expect(canViewPhysicalAttributes("owner", profile)).toBe(true);
    });

    it("producer can view physical attributes when not hidden from search", () => {
      const profile = createMockProfile({ hideFromSearch: false });
      expect(canViewPhysicalAttributes("producer", profile)).toBe(true);
    });

    it("producer cannot view physical attributes when hidden from search", () => {
      const profile = createMockProfile({ hideFromSearch: true });
      expect(canViewPhysicalAttributes("producer", profile)).toBe(false);
    });

    it("public users cannot view physical attributes", () => {
      const profile = createMockProfile({ hideFromSearch: false });
      expect(canViewPhysicalAttributes("public", profile)).toBe(false);
    });
  });

  describe("canEditPhysicalAttributes", () => {
    it("only owner can edit physical attributes", () => {
      expect(canEditPhysicalAttributes("owner")).toBe(true);
      expect(canEditPhysicalAttributes("producer")).toBe(false);
      expect(canEditPhysicalAttributes("public")).toBe(false);
    });
  });

  describe("canSearchTalent", () => {
    it("returns false for null viewer", () => {
      expect(canSearchTalent(null)).toBe(false);
    });

    it("returns true for producer users", () => {
      const producer = createMockUser({ userType: "producer" });
      expect(canSearchTalent(producer)).toBe(true);
    });

    it("returns true for admin users", () => {
      const admin = createMockUser({ userType: "admin" });
      expect(canSearchTalent(admin)).toBe(true);
    });

    it("returns false for talent users", () => {
      const talent = createMockUser({ userType: "talent" });
      expect(canSearchTalent(talent)).toBe(false);
    });
  });

  describe("isProfileSearchable", () => {
    it("returns true for public profiles not hidden from search", () => {
      const profile = createMockProfile({ isPublic: true, hideFromSearch: false });
      expect(isProfileSearchable(profile)).toBe(true);
    });

    it("returns false for private profiles", () => {
      const profile = createMockProfile({ isPublic: false, hideFromSearch: false });
      expect(isProfileSearchable(profile)).toBe(false);
    });

    it("returns false for profiles hidden from search", () => {
      const profile = createMockProfile({ isPublic: true, hideFromSearch: true });
      expect(isProfileSearchable(profile)).toBe(false);
    });
  });

  describe("stripPhysicalAttributes", () => {
    it("removes all physical attribute fields", () => {
      const profile = createMockProfile();
      const stripped = stripPhysicalAttributes(profile);

      expect(stripped).not.toHaveProperty("heightInches");
      expect(stripped).not.toHaveProperty("hairColor");
      expect(stripped).not.toHaveProperty("naturalHairColor");
      expect(stripped).not.toHaveProperty("eyeColor");
      expect(stripped).not.toHaveProperty("gender");
      expect(stripped).not.toHaveProperty("ethnicity");
      expect(stripped).not.toHaveProperty("ageRangeLow");
      expect(stripped).not.toHaveProperty("ageRangeHigh");
      expect(stripped).not.toHaveProperty("vocalRange");
      expect(stripped).not.toHaveProperty("willingnessToRemoveHair");
      expect(stripped).not.toHaveProperty("isOver18");
      expect(stripped).not.toHaveProperty("hideFromSearch");
    });

    it("preserves non-physical attribute fields", () => {
      const profile = createMockProfile();
      const stripped = stripPhysicalAttributes(profile);

      expect(stripped.id).toBe(profile.id);
      expect(stripped.firstName).toBe(profile.firstName);
      expect(stripped.lastName).toBe(profile.lastName);
      expect(stripped.bio).toBe(profile.bio);
      expect(stripped.isPublic).toBe(profile.isPublic);
    });
  });

  describe("getVisibleProfile", () => {
    it("returns full profile for owner", () => {
      const profile = createMockProfile();
      const visible = getVisibleProfile(profile, "owner");

      expect(visible).toHaveProperty("heightInches");
      expect(visible).toHaveProperty("hairColor");
    });

    it("returns full profile for producer when not hidden", () => {
      const profile = createMockProfile({ hideFromSearch: false });
      const visible = getVisibleProfile(profile, "producer");

      expect(visible).toHaveProperty("heightInches");
      expect(visible).toHaveProperty("hairColor");
    });

    it("returns stripped profile for producer when hidden from search", () => {
      const profile = createMockProfile({ hideFromSearch: true });
      const visible = getVisibleProfile(profile, "producer");

      expect(visible).not.toHaveProperty("heightInches");
      expect(visible).not.toHaveProperty("hairColor");
      expect(visible).toHaveProperty("firstName");
    });

    it("returns stripped profile for public viewers", () => {
      const profile = createMockProfile();
      const visible = getVisibleProfile(profile, "public");

      expect(visible).not.toHaveProperty("heightInches");
      expect(visible).not.toHaveProperty("hairColor");
      expect(visible).toHaveProperty("firstName");
    });
  });
});
