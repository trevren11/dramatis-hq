import { describe, it, expect } from "vitest";
import { cn, formatDate, formatDateTime } from "../utils";

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
