import { describe, it, expect } from "vitest";
import {
  savedSearchSchema,
  talentListSchema,
  talentListMemberSchema,
  addMultipleMembersSchema,
} from "../talent-lists";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Talent Lists Validation", () => {
  describe("savedSearchSchema", () => {
    it("accepts valid saved search with minimal fields", () => {
      const search = {
        name: "Broadway Performers",
        filters: {},
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(true);
    });

    it("accepts saved search with all fields", () => {
      const search = {
        name: "Young Broadway Talent",
        description: "Search for young performers for upcoming shows",
        filters: {
          search: "dancer",
          location: "New York",
          locationRadius: 50,
          heightMin: 60,
          heightMax: 72,
          ageMin: 18,
          ageMax: 30,
          hairColors: ["brown" as const, "black" as const],
          eyeColors: ["brown" as const],
          genders: ["female" as const],
          skills: ["ballet", "tap"],
          unionStatuses: ["AEA" as const],
          willingToCutHair: true,
          mustBe18Plus: true,
          availableFrom: "2024-06-01",
          availableTo: "2024-12-31",
          experienceLevel: ["professional" as const],
        },
        sortOrder: "relevance" as const,
        notifyOnMatch: true,
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const search = {
        name: "",
        filters: {},
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejects name over 100 characters", () => {
      const search = {
        name: "a".repeat(101),
        filters: {},
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejects description over 500 characters", () => {
      const search = {
        name: "Search",
        description: "a".repeat(501),
        filters: {},
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("accepts all valid sort orders", () => {
      const sortOrders = ["relevance", "name_asc", "name_desc", "recent_activity"];

      for (const sortOrder of sortOrders) {
        const search = { name: "Search", filters: {}, sortOrder };
        expect(savedSearchSchema.safeParse(search).success).toBe(true);
      }
    });

    it("rejects location radius below 1", () => {
      const search = {
        name: "Search",
        filters: {
          locationRadius: 0,
        },
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejects location radius above 500", () => {
      const search = {
        name: "Search",
        filters: {
          locationRadius: 501,
        },
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejects height below 36 inches", () => {
      const search = {
        name: "Search",
        filters: {
          heightMin: 35,
        },
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejects height above 96 inches", () => {
      const search = {
        name: "Search",
        filters: {
          heightMax: 97,
        },
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejects age below 0", () => {
      const search = {
        name: "Search",
        filters: {
          ageMin: -1,
        },
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejects age above 100", () => {
      const search = {
        name: "Search",
        filters: {
          ageMax: 101,
        },
      };

      const result = savedSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });
  });

  describe("talentListSchema", () => {
    it("accepts valid talent list with minimal fields", () => {
      const list = {
        name: "Favorites",
      };

      const result = talentListSchema.safeParse(list);
      expect(result.success).toBe(true);
    });

    it("accepts talent list with all fields", () => {
      const list = {
        name: "Hamilton Callbacks",
        description: "Performers called back for Hamilton",
        color: "blue" as const,
        isShared: true,
      };

      const result = talentListSchema.safeParse(list);
      expect(result.success).toBe(true);
    });

    it("accepts all valid colors", () => {
      const colors = ["blue", "green", "purple", "orange", "pink", "yellow", "red", "gray"];

      for (const color of colors) {
        const list = { name: "List", color };
        expect(talentListSchema.safeParse(list).success).toBe(true);
      }
    });

    it("rejects empty name", () => {
      const list = {
        name: "",
      };

      const result = talentListSchema.safeParse(list);
      expect(result.success).toBe(false);
    });

    it("rejects name over 100 characters", () => {
      const list = {
        name: "a".repeat(101),
      };

      const result = talentListSchema.safeParse(list);
      expect(result.success).toBe(false);
    });

    it("rejects description over 500 characters", () => {
      const list = {
        name: "List",
        description: "a".repeat(501),
      };

      const result = talentListSchema.safeParse(list);
      expect(result.success).toBe(false);
    });

    it("rejects invalid color", () => {
      const list = {
        name: "List",
        color: "rainbow",
      };

      const result = talentListSchema.safeParse(list);
      expect(result.success).toBe(false);
    });
  });

  describe("talentListMemberSchema", () => {
    it("accepts valid member with minimal fields", () => {
      const member = {
        talentProfileId: validUUID,
      };

      const result = talentListMemberSchema.safeParse(member);
      expect(result.success).toBe(true);
    });

    it("accepts member with notes", () => {
      const member = {
        talentProfileId: validUUID,
        notes: "Great singer, consider for lead role",
      };

      const result = talentListMemberSchema.safeParse(member);
      expect(result.success).toBe(true);
    });

    it("rejects invalid talent profile UUID", () => {
      const member = {
        talentProfileId: "not-a-uuid",
      };

      const result = talentListMemberSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it("rejects notes over 1000 characters", () => {
      const member = {
        talentProfileId: validUUID,
        notes: "a".repeat(1001),
      };

      const result = talentListMemberSchema.safeParse(member);
      expect(result.success).toBe(false);
    });
  });

  describe("addMultipleMembersSchema", () => {
    it("accepts valid multiple members", () => {
      const members = {
        talentProfileIds: [
          validUUID,
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
      };

      const result = addMultipleMembersSchema.safeParse(members);
      expect(result.success).toBe(true);
    });

    it("accepts single member", () => {
      const members = {
        talentProfileIds: [validUUID],
      };

      const result = addMultipleMembersSchema.safeParse(members);
      expect(result.success).toBe(true);
    });

    it("rejects empty array", () => {
      const members = {
        talentProfileIds: [],
      };

      const result = addMultipleMembersSchema.safeParse(members);
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID in array", () => {
      const members = {
        talentProfileIds: [validUUID, "not-a-uuid"],
      };

      const result = addMultipleMembersSchema.safeParse(members);
      expect(result.success).toBe(false);
    });

    it("rejects missing talentProfileIds", () => {
      const members = {};

      const result = addMultipleMembersSchema.safeParse(members);
      expect(result.success).toBe(false);
    });
  });
});
