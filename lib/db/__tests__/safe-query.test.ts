import { describe, it, expect, vi, beforeEach } from "vitest";
import { safeQuery, safeQueryWithDefault } from "../safe-query";

// Mock the logger
vi.mock("@/lib/monitoring/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("safeQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success result when query succeeds", async () => {
    const mockData = { id: 1, name: "Test" };
    const queryFn = vi.fn().mockResolvedValue(mockData);

    const result = await safeQuery(queryFn, "test-query");

    expect(result).toEqual({ success: true, data: mockData });
    expect(queryFn).toHaveBeenCalled();
  });

  it("should return error result when query fails", async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error("Database error"));

    const result = await safeQuery(queryFn, "test-query");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Database error");
      expect(result.isSchemaError).toBe(false);
    }
  });

  it("should detect schema-related errors", async () => {
    const schemaErrorMessages = [
      "column xyz does not exist",
      "relation abc does not exist",
      "undefined column in query",
    ];

    for (const message of schemaErrorMessages) {
      const queryFn = vi.fn().mockRejectedValue(new Error(message));

      const result = await safeQuery(queryFn, "schema-test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.isSchemaError).toBe(true);
      }
    }
  });

  it("should handle non-Error objects", async () => {
    const queryFn = vi.fn().mockRejectedValue("String error");

    const result = await safeQuery(queryFn, "test-query");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("String error");
    }
  });
});

describe("safeQueryWithDefault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return data when query succeeds", async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    const queryFn = vi.fn().mockResolvedValue(mockData);

    const result = await safeQueryWithDefault(queryFn, [], "test-query");

    expect(result).toEqual(mockData);
  });

  it("should return default value when query fails", async () => {
    const defaultValue = [{ id: "default" }];
    const queryFn = vi.fn().mockRejectedValue(new Error("Database error"));

    const result = await safeQueryWithDefault(queryFn, defaultValue, "test-query");

    expect(result).toEqual(defaultValue);
  });

  it("should return empty array default when query fails with schema error", async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error("column xyz does not exist"));

    const result = await safeQueryWithDefault(queryFn, [], "test-query");

    expect(result).toEqual([]);
  });
});
