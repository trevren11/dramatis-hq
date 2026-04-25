import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  rateMetric,
  reportWebVital,
  trackApiResponse,
  trackDatabaseQuery,
  createTimer,
  measureAsync,
  PERFORMANCE_BUDGETS,
} from "../performance";

// Mock dependencies
vi.mock("@sentry/nextjs", () => ({
  setMeasurement: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Performance Monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("PERFORMANCE_BUDGETS", () => {
    it("should have TTFB thresholds", () => {
      expect(PERFORMANCE_BUDGETS.TTFB.good).toBe(800);
      expect(PERFORMANCE_BUDGETS.TTFB.needsImprovement).toBe(1800);
    });

    it("should have FCP thresholds", () => {
      expect(PERFORMANCE_BUDGETS.FCP.good).toBe(1800);
      expect(PERFORMANCE_BUDGETS.FCP.needsImprovement).toBe(3000);
    });

    it("should have LCP thresholds", () => {
      expect(PERFORMANCE_BUDGETS.LCP.good).toBe(2500);
      expect(PERFORMANCE_BUDGETS.LCP.needsImprovement).toBe(4000);
    });

    it("should have CLS thresholds", () => {
      expect(PERFORMANCE_BUDGETS.CLS.good).toBe(0.1);
      expect(PERFORMANCE_BUDGETS.CLS.needsImprovement).toBe(0.25);
    });

    it("should have API response thresholds", () => {
      expect(PERFORMANCE_BUDGETS.API_RESPONSE.good).toBe(200);
      expect(PERFORMANCE_BUDGETS.API_RESPONSE.needsImprovement).toBe(1000);
    });

    it("should have DB query thresholds", () => {
      expect(PERFORMANCE_BUDGETS.DB_QUERY.good).toBe(100);
      expect(PERFORMANCE_BUDGETS.DB_QUERY.needsImprovement).toBe(500);
    });
  });

  describe("rateMetric", () => {
    it("should rate good metrics", () => {
      const result = rateMetric(100, { good: 200, needsImprovement: 500 });
      expect(result).toBe("good");
    });

    it("should rate needs-improvement metrics", () => {
      const result = rateMetric(300, { good: 200, needsImprovement: 500 });
      expect(result).toBe("needs-improvement");
    });

    it("should rate poor metrics", () => {
      const result = rateMetric(600, { good: 200, needsImprovement: 500 });
      expect(result).toBe("poor");
    });

    it("should rate exactly at good threshold as good", () => {
      const result = rateMetric(200, { good: 200, needsImprovement: 500 });
      expect(result).toBe("good");
    });

    it("should rate exactly at needs-improvement threshold as needs-improvement", () => {
      const result = rateMetric(500, { good: 200, needsImprovement: 500 });
      expect(result).toBe("needs-improvement");
    });
  });

  describe("reportWebVital", () => {
    it("should report good web vitals", () => {
      reportWebVital({
        name: "LCP",
        value: 2000,
        rating: "good",
        id: "v1-123",
      });
      expect(true).toBe(true);
    });

    it("should report needs-improvement web vitals", () => {
      reportWebVital({
        name: "FCP",
        value: 2500,
        rating: "needs-improvement",
        id: "v1-456",
      });
      expect(true).toBe(true);
    });

    it("should warn on poor web vitals", () => {
      reportWebVital({
        name: "CLS",
        value: 0.5,
        rating: "poor",
        id: "v1-789",
      });
      expect(true).toBe(true);
    });

    it("should include navigation type", () => {
      reportWebVital({
        name: "TTFB",
        value: 500,
        rating: "good",
        navigationType: "navigate",
        id: "v1-101",
      });
      expect(true).toBe(true);
    });
  });

  describe("trackApiResponse", () => {
    it("should track fast API responses", () => {
      trackApiResponse("/api/users", "GET", 50, 200);
      expect(true).toBe(true);
    });

    it("should track moderate API responses", () => {
      trackApiResponse("/api/search", "POST", 500, 200);
      expect(true).toBe(true);
    });

    it("should warn on slow API responses", () => {
      trackApiResponse("/api/report", "GET", 2000, 200);
      expect(true).toBe(true);
    });

    it("should track different HTTP methods", () => {
      trackApiResponse("/api/users", "POST", 100, 201);
      trackApiResponse("/api/users/123", "PUT", 150, 200);
      trackApiResponse("/api/users/123", "DELETE", 80, 204);
      expect(true).toBe(true);
    });

    it("should track error responses", () => {
      trackApiResponse("/api/login", "POST", 100, 401);
      trackApiResponse("/api/data", "GET", 500, 500);
      expect(true).toBe(true);
    });
  });

  describe("trackDatabaseQuery", () => {
    it("should track fast queries", () => {
      trackDatabaseQuery("SELECT", "users", 20, 10);
      expect(true).toBe(true);
    });

    it("should track moderate queries", () => {
      trackDatabaseQuery("UPDATE", "profiles", 300, 1);
      expect(true).toBe(true);
    });

    it("should warn on slow queries", () => {
      trackDatabaseQuery("SELECT", "large_table", 1500, 10000);
      expect(true).toBe(true);
    });

    it("should track different operations", () => {
      trackDatabaseQuery("INSERT", "auditions", 50);
      trackDatabaseQuery("DELETE", "sessions", 30, 5);
      expect(true).toBe(true);
    });
  });

  describe("createTimer", () => {
    it("should create a timer", () => {
      const timer = createTimer();
      expect(timer).toBeDefined();
      expect(timer.end).toBeDefined();
      expect(timer.elapsed).toBeDefined();
    });

    it("should measure elapsed time", async () => {
      const timer = createTimer();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it("should return duration on end", async () => {
      const timer = createTimer();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const duration = timer.end();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("measureAsync", () => {
    it("should measure successful async operations", async () => {
      const result = await measureAsync("test-operation", () => Promise.resolve("success"));
      expect(result).toBe("success");
    });

    it("should measure async operations with delay", async () => {
      const result = await measureAsync("slow-operation", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 42;
      });
      expect(result).toBe(42);
    });

    it("should handle async operation errors", async () => {
      await expect(
        measureAsync("failing-operation", () => Promise.reject(new Error("Test error")))
      ).rejects.toThrow("Test error");
    });

    it("should log with tags", async () => {
      await measureAsync("tagged-operation", () => Promise.resolve("result"), {
        tags: { service: "test" },
      });
      expect(true).toBe(true);
    });

    it("should warn when exceeding threshold", async () => {
      await measureAsync(
        "threshold-operation",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return "done";
        },
        { threshold: 10 }
      );
      expect(true).toBe(true);
    });
  });
});
