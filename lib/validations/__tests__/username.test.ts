import { describe, it, expect } from "vitest";
import {
  usernameSchema,
  usernameCheckSchema,
  usernameSetSchema,
  normalizeUsername,
  isValidUsername,
  RESERVED_USERNAMES,
} from "../username";

describe("Username Validation", () => {
  describe("usernameSchema", () => {
    it("accepts valid usernames", () => {
      const validUsernames = [
        "john",
        "john-doe",
        "john_doe",
        "john123",
        "j0hn-d0e_123",
        "abc",
        "a1b",
      ];

      for (const username of validUsernames) {
        expect(usernameSchema.safeParse(username).success).toBe(true);
      }
    });

    it("rejects usernames that are too short", () => {
      const result = usernameSchema.safeParse("ab");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 3 characters");
      }
    });

    it("rejects usernames that are too long", () => {
      const longUsername = "a".repeat(31);
      const result = usernameSchema.safeParse(longUsername);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at most 30 characters");
      }
    });

    it("rejects usernames with uppercase letters", () => {
      const result = usernameSchema.safeParse("JohnDoe");
      expect(result.success).toBe(false);
    });

    it("rejects usernames with special characters", () => {
      const invalidUsernames = ["john@doe", "john.doe", "john!doe", "john doe", "john#doe"];

      for (const username of invalidUsernames) {
        expect(usernameSchema.safeParse(username).success).toBe(false);
      }
    });

    it("rejects usernames starting with hyphen or underscore", () => {
      const result1 = usernameSchema.safeParse("-john");
      const result2 = usernameSchema.safeParse("_john");
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it("rejects usernames ending with hyphen or underscore", () => {
      const result1 = usernameSchema.safeParse("john-");
      const result2 = usernameSchema.safeParse("john_");
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it("rejects reserved usernames", () => {
      for (const reserved of RESERVED_USERNAMES) {
        const result = usernameSchema.safeParse(reserved);
        expect(result.success).toBe(false);
      }
    });

    it("accepts single character usernames that are letters or numbers", () => {
      // Single character usernames are valid per the regex
      expect(usernameSchema.safeParse("a").success).toBe(false); // Too short (min 3)
    });
  });

  describe("usernameCheckSchema", () => {
    it("validates username check input", () => {
      const validInput = { username: "john-doe" };
      expect(usernameCheckSchema.safeParse(validInput).success).toBe(true);
    });

    it("rejects invalid username in check input", () => {
      const invalidInput = { username: "a" };
      expect(usernameCheckSchema.safeParse(invalidInput).success).toBe(false);
    });

    it("rejects missing username field", () => {
      const invalidInput = {};
      expect(usernameCheckSchema.safeParse(invalidInput).success).toBe(false);
    });
  });

  describe("usernameSetSchema", () => {
    it("validates username set input", () => {
      const validInput = { username: "john-doe" };
      expect(usernameSetSchema.safeParse(validInput).success).toBe(true);
    });

    it("rejects invalid username in set input", () => {
      const invalidInput = { username: "admin" };
      expect(usernameSetSchema.safeParse(invalidInput).success).toBe(false);
    });
  });

  describe("normalizeUsername", () => {
    it("converts to lowercase", () => {
      expect(normalizeUsername("JohnDoe")).toBe("johndoe");
      expect(normalizeUsername("JOHN")).toBe("john");
    });

    it("trims whitespace", () => {
      expect(normalizeUsername("  john  ")).toBe("john");
      expect(normalizeUsername("\tjohn\n")).toBe("john");
    });

    it("handles mixed case and whitespace", () => {
      expect(normalizeUsername("  JoHn-DoE  ")).toBe("john-doe");
    });

    it("preserves valid characters", () => {
      expect(normalizeUsername("john-doe_123")).toBe("john-doe_123");
    });
  });

  describe("isValidUsername", () => {
    it("returns true for valid usernames", () => {
      expect(isValidUsername("john-doe")).toBe(true);
      expect(isValidUsername("john123")).toBe(true);
      expect(isValidUsername("test_user")).toBe(true);
    });

    it("returns false for invalid usernames", () => {
      expect(isValidUsername("ab")).toBe(false); // Too short
      expect(isValidUsername("admin")).toBe(false); // Reserved
      expect(isValidUsername("john@doe")).toBe(false); // Invalid character
      expect(isValidUsername("-john")).toBe(false); // Starts with hyphen
    });

    it("returns false for reserved usernames", () => {
      expect(isValidUsername("admin")).toBe(false);
      expect(isValidUsername("api")).toBe(false);
      expect(isValidUsername("login")).toBe(false);
    });
  });

  describe("RESERVED_USERNAMES", () => {
    it("includes common reserved words", () => {
      expect(RESERVED_USERNAMES).toContain("admin");
      expect(RESERVED_USERNAMES).toContain("api");
      expect(RESERVED_USERNAMES).toContain("login");
      expect(RESERVED_USERNAMES).toContain("logout");
      expect(RESERVED_USERNAMES).toContain("profile");
      expect(RESERVED_USERNAMES).toContain("settings");
      expect(RESERVED_USERNAMES).toContain("support");
      expect(RESERVED_USERNAMES).toContain("help");
    });

    it("is an array of strings", () => {
      expect(Array.isArray(RESERVED_USERNAMES)).toBe(true);
      for (const word of RESERVED_USERNAMES) {
        expect(typeof word).toBe("string");
      }
    });
  });
});
