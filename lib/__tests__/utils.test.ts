import { describe, it, expect } from "vitest";
import { cn, formatDate, formatDateTime, generateSlug, generateUniqueSlug } from "../utils";

describe("cn utility", () => {
  it("joins multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, "bar", null, undefined, "baz")).toBe("foo bar baz");
  });

  it("returns empty string for no classes", () => {
    expect(cn()).toBe("");
  });

  it("returns empty string for all falsy values", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats date in en-US locale", () => {
    const date = new Date("2024-03-15T12:00:00Z");
    expect(formatDate(date)).toMatch(/Mar 15, 2024/);
  });
});

describe("formatDateTime", () => {
  it("formats date and time in en-US locale", () => {
    const date = new Date("2024-03-15T14:30:00Z");
    const result = formatDateTime(date);
    expect(result).toMatch(/Mar 15, 2024/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("generateSlug", () => {
  it("converts title to lowercase slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(generateSlug("Hello, World!")).toBe("hello-world");
  });

  it("replaces multiple spaces with single hyphen", () => {
    expect(generateSlug("Hello   World")).toBe("hello-world");
  });

  it("removes leading and trailing hyphens", () => {
    expect(generateSlug("-Hello World-")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("truncates to 200 characters", () => {
    const longTitle = "a".repeat(250);
    expect(generateSlug(longTitle).length).toBe(200);
  });

  it("handles unicode characters", () => {
    expect(generateSlug("Café & Résumé")).toBe("caf-rsum");
  });

  it("preserves numbers", () => {
    expect(generateSlug("Show 2024")).toBe("show-2024");
  });
});

describe("generateUniqueSlug", () => {
  it("returns base slug without suffix", () => {
    expect(generateUniqueSlug("Hello World")).toBe("hello-world");
  });

  it("appends suffix when provided", () => {
    expect(generateUniqueSlug("Hello World", "1")).toBe("hello-world-1");
  });

  it("handles numeric suffix", () => {
    expect(generateUniqueSlug("Test Show", "42")).toBe("test-show-42");
  });
});
