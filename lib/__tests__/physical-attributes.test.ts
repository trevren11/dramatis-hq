import { describe, it, expect } from "vitest";
import {
  physicalAttributesSchema,
  talentSearchSchema,
  heightToFeetInches,
  feetInchesToHeight,
  heightToCm,
  cmToHeight,
} from "../validations/physical-attributes";

describe("Physical Attributes Validation", () => {
  describe("physicalAttributesSchema", () => {
    it("accepts valid physical attributes", () => {
      const data = {
        heightInches: 70,
        hairColor: "brown",
        eyeColor: "blue",
        ethnicity: "caucasian",
        ageRangeLow: 25,
        ageRangeHigh: 35,
        vocalRange: "tenor",
        willingnessToRemoveHair: "yes",
        isOver18: true,
        hideFromSearch: false,
      };

      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty/optional fields", () => {
      const data = {};
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts null values for optional fields", () => {
      const data = {
        heightInches: null,
        hairColor: null,
        eyeColor: null,
      };
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects height below minimum (36 inches)", () => {
      const data = { heightInches: 30 };
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects height above maximum (96 inches)", () => {
      const data = { heightInches: 100 };
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects invalid hair color", () => {
      const data = { hairColor: "purple" };
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects invalid eye color", () => {
      const data = { eyeColor: "purple" };
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects age range where min > max", () => {
      const data = { ageRangeLow: 40, ageRangeHigh: 30 };
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success && result.error.issues[0]) {
        expect(result.error.issues[0].message).toContain("less than or equal");
      }
    });

    it("accepts equal age range values", () => {
      const data = { ageRangeLow: 30, ageRangeHigh: 30 };
      const result = physicalAttributesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts all valid willingness options", () => {
      const options = ["yes", "no", "negotiable"];
      for (const option of options) {
        const result = physicalAttributesSchema.safeParse({ willingnessToRemoveHair: option });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid vocal ranges", () => {
      const ranges = [
        "soprano",
        "mezzo_soprano",
        "alto",
        "countertenor",
        "tenor",
        "baritone",
        "bass",
        "not_applicable",
      ];
      for (const range of ranges) {
        const result = physicalAttributesSchema.safeParse({ vocalRange: range });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("talentSearchSchema", () => {
    it("accepts valid search filters", () => {
      const data = {
        heightMin: 60,
        heightMax: 75,
        ageMin: 20,
        ageMax: 40,
        hairColors: ["brown", "black"],
        eyeColors: ["blue", "green"],
        mustBe18Plus: true,
        page: 1,
        limit: 20,
      };

      const result = talentSearchSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("applies default values for page and limit", () => {
      const data = {};
      const result = talentSearchSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("rejects page less than 1", () => {
      const data = { page: 0 };
      const result = talentSearchSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects limit greater than 100", () => {
      const data = { limit: 150 };
      const result = talentSearchSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("accepts empty arrays for multi-select filters", () => {
      const data = { hairColors: [], eyeColors: [] };
      const result = talentSearchSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Height Conversion Utilities", () => {
    describe("heightToFeetInches", () => {
      it("converts total inches to feet and inches", () => {
        expect(heightToFeetInches(70)).toEqual({ feet: 5, inches: 10 });
        expect(heightToFeetInches(72)).toEqual({ feet: 6, inches: 0 });
        expect(heightToFeetInches(65)).toEqual({ feet: 5, inches: 5 });
      });
    });

    describe("feetInchesToHeight", () => {
      it("converts feet and inches to total inches", () => {
        expect(feetInchesToHeight(5, 10)).toBe(70);
        expect(feetInchesToHeight(6, 0)).toBe(72);
        expect(feetInchesToHeight(5, 5)).toBe(65);
      });
    });

    describe("heightToCm", () => {
      it("converts inches to centimeters", () => {
        expect(heightToCm(70)).toBe(178);
        expect(heightToCm(72)).toBe(183);
      });
    });

    describe("cmToHeight", () => {
      it("converts centimeters to inches", () => {
        expect(cmToHeight(178)).toBe(70);
        expect(cmToHeight(183)).toBe(72);
      });
    });

    describe("round-trip conversion", () => {
      it("maintains accuracy through conversions", () => {
        const original = 70;
        const cm = heightToCm(original);
        const backToInches = cmToHeight(cm);
        expect(backToInches).toBe(original);
      });
    });
  });
});
