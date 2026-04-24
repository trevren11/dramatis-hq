import { describe, it, expect } from "vitest";
import {
  companySlugSchema,
  companyProfileSchema,
  companyProfileUpdateSchema,
  productionPhotoCreateSchema,
  productionPhotoUpdateSchema,
  productionPhotoBulkCreateSchema,
  companySocialLinksSchema,
} from "../company";

describe("Company Validation", () => {
  describe("companySlugSchema", () => {
    it("accepts valid slugs", () => {
      const validSlugs = [
        "abc",
        "my-company",
        "company123",
        "the-theater-company",
        "broadway-2024",
        "a1b",
      ];

      for (const slug of validSlugs) {
        expect(companySlugSchema.safeParse(slug).success).toBe(true);
      }
    });

    it("rejects slugs that are too short", () => {
      const result = companySlugSchema.safeParse("ab");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 3 characters");
      }
    });

    it("rejects slugs that are too long", () => {
      const longSlug = "a".repeat(101);
      const result = companySlugSchema.safeParse(longSlug);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at most 100 characters");
      }
    });

    it("rejects slugs with uppercase letters", () => {
      const result = companySlugSchema.safeParse("MyCompany");
      expect(result.success).toBe(false);
    });

    it("rejects slugs with special characters", () => {
      const invalidSlugs = [
        "company@name",
        "company.name",
        "company_name",
        "company name",
        "company!",
      ];

      for (const slug of invalidSlugs) {
        expect(companySlugSchema.safeParse(slug).success).toBe(false);
      }
    });

    it("rejects slugs starting or ending with hyphen", () => {
      expect(companySlugSchema.safeParse("-company").success).toBe(false);
      expect(companySlugSchema.safeParse("company-").success).toBe(false);
    });

    it("rejects slugs with consecutive hyphens", () => {
      expect(companySlugSchema.safeParse("company--name").success).toBe(false);
    });
  });

  describe("companySocialLinksSchema", () => {
    it("accepts valid social links", () => {
      const validLinks = {
        instagram: "https://instagram.com/company",
        twitter: "https://twitter.com/company",
        linkedin: "https://linkedin.com/company/test",
        facebook: "https://facebook.com/company",
        youtube: "https://youtube.com/@company",
        vimeo: "https://vimeo.com/company",
      };

      expect(companySocialLinksSchema.safeParse(validLinks).success).toBe(true);
    });

    it("accepts empty strings for social links", () => {
      const links = {
        instagram: "",
        twitter: "",
      };

      expect(companySocialLinksSchema.safeParse(links).success).toBe(true);
    });

    it("accepts partial social links", () => {
      const links = {
        instagram: "https://instagram.com/company",
      };

      expect(companySocialLinksSchema.safeParse(links).success).toBe(true);
    });

    it("rejects invalid URLs", () => {
      const links = {
        instagram: "not-a-url",
      };

      expect(companySocialLinksSchema.safeParse(links).success).toBe(false);
    });
  });

  describe("companyProfileSchema", () => {
    it("accepts valid company profile", () => {
      const validProfile = {
        companyName: "Broadway Productions",
        slug: "broadway-productions",
        isPublic: true,
      };

      expect(companyProfileSchema.safeParse(validProfile).success).toBe(true);
    });

    it("accepts full company profile with all fields", () => {
      const fullProfile = {
        companyName: "Broadway Productions",
        slug: "broadway-productions",
        logoUrl: "https://example.com/logo.png",
        description: "A leading theater company",
        location: "New York, NY",
        website: "https://broadwayproductions.com",
        unionStatus: "union" as const,
        socialLinks: {
          instagram: "https://instagram.com/broadway",
        },
        isPublic: true,
      };

      expect(companyProfileSchema.safeParse(fullProfile).success).toBe(true);
    });

    it("rejects profile without company name", () => {
      const profile = {
        slug: "broadway-productions",
        isPublic: true,
      };

      expect(companyProfileSchema.safeParse(profile).success).toBe(false);
    });

    it("rejects profile without slug", () => {
      const profile = {
        companyName: "Broadway Productions",
        isPublic: true,
      };

      expect(companyProfileSchema.safeParse(profile).success).toBe(false);
    });

    it("rejects profile with company name too long", () => {
      const profile = {
        companyName: "a".repeat(256),
        slug: "test-company",
        isPublic: true,
      };

      expect(companyProfileSchema.safeParse(profile).success).toBe(false);
    });

    it("accepts empty website as empty string", () => {
      const profile = {
        companyName: "Test Company",
        slug: "test-company",
        website: "",
        isPublic: true,
      };

      expect(companyProfileSchema.safeParse(profile).success).toBe(true);
    });

    it("rejects invalid website URL", () => {
      const profile = {
        companyName: "Test Company",
        slug: "test-company",
        website: "not-a-url",
        isPublic: true,
      };

      expect(companyProfileSchema.safeParse(profile).success).toBe(false);
    });

    it("accepts valid union status values", () => {
      const statuses = ["union", "non_union", "union_signatory", "both"];

      for (const status of statuses) {
        const profile = {
          companyName: "Test Company",
          slug: "test-company",
          unionStatus: status,
          isPublic: true,
        };
        expect(companyProfileSchema.safeParse(profile).success).toBe(true);
      }
    });
  });

  describe("companyProfileUpdateSchema", () => {
    it("accepts partial updates", () => {
      const update = {
        description: "Updated description",
      };

      expect(companyProfileUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update object", () => {
      expect(companyProfileUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("validates slug when provided", () => {
      const invalidUpdate = {
        slug: "INVALID",
      };

      expect(companyProfileUpdateSchema.safeParse(invalidUpdate).success).toBe(false);
    });
  });

  describe("productionPhotoCreateSchema", () => {
    it("accepts valid photo create payload", () => {
      const photo = {
        url: "https://example.com/photo.jpg",
      };

      expect(productionPhotoCreateSchema.safeParse(photo).success).toBe(true);
    });

    it("accepts full photo create payload", () => {
      const photo = {
        url: "https://example.com/photo.jpg",
        thumbnailUrl: "https://example.com/thumb.jpg",
        originalFilename: "production_shot.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        title: "Opening Night",
        description: "Cast taking their bows",
        productionName: "Hamlet (2024)",
        isFeatured: true,
        sortOrder: 0,
      };

      expect(productionPhotoCreateSchema.safeParse(photo).success).toBe(true);
    });

    it("rejects missing url", () => {
      const photo = {
        title: "Opening Night",
      };

      expect(productionPhotoCreateSchema.safeParse(photo).success).toBe(false);
    });

    it("rejects invalid url", () => {
      const photo = {
        url: "not-a-url",
      };

      expect(productionPhotoCreateSchema.safeParse(photo).success).toBe(false);
    });

    it("rejects negative file size", () => {
      const photo = {
        url: "https://example.com/photo.jpg",
        fileSize: -100,
      };

      expect(productionPhotoCreateSchema.safeParse(photo).success).toBe(false);
    });

    it("defaults isFeatured to false", () => {
      const photo = {
        url: "https://example.com/photo.jpg",
      };

      const result = productionPhotoCreateSchema.safeParse(photo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isFeatured).toBe(false);
      }
    });
  });

  describe("productionPhotoUpdateSchema", () => {
    it("accepts valid update", () => {
      const update = {
        title: "New Title",
        isFeatured: true,
      };

      expect(productionPhotoUpdateSchema.safeParse(update).success).toBe(true);
    });

    it("accepts empty update", () => {
      expect(productionPhotoUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects title too long", () => {
      const update = {
        title: "a".repeat(256),
      };

      expect(productionPhotoUpdateSchema.safeParse(update).success).toBe(false);
    });
  });

  describe("productionPhotoBulkCreateSchema", () => {
    it("accepts valid bulk create payload", () => {
      const bulk = {
        photos: [
          { url: "https://example.com/photo1.jpg" },
          { url: "https://example.com/photo2.jpg" },
        ],
      };

      expect(productionPhotoBulkCreateSchema.safeParse(bulk).success).toBe(true);
    });

    it("rejects more than 20 photos", () => {
      const photos = Array.from({ length: 21 }, (_, i) => ({
        url: `https://example.com/photo${String(i)}.jpg`,
      }));

      const bulk = { photos };

      expect(productionPhotoBulkCreateSchema.safeParse(bulk).success).toBe(false);
    });

    it("accepts empty photos array", () => {
      const bulk = { photos: [] };

      expect(productionPhotoBulkCreateSchema.safeParse(bulk).success).toBe(true);
    });
  });
});
