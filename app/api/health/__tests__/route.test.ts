/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock drizzle-orm sql function
vi.mock("drizzle-orm", () => ({
  sql: vi.fn(),
}));

// Mock database with a function that can be controlled
vi.mock("@/lib/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/monitoring/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { GET, type HealthResponse } from "../route";
import { db } from "@/lib/db";

// Get the mock - must be after import. Using vi.mocked to properly type the mock.
const mockDb = vi.mocked(db);
const mockDbExecute = mockDb.execute;

describe("Health Check Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env.REDIS_URL = "";
    process.env.S3_ENDPOINT = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/health", () => {
    it("should return healthy status when all checks pass", async () => {
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.checks.database.status).toBe("ok");
    });

    it("should include version in response", async () => {
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.version).toBeDefined();
    });

    it("should include timestamp in response", async () => {
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it("should include uptime in response", async () => {
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe("number");
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return unhealthy status when database is down", async () => {
      mockDbExecute.mockRejectedValue(new Error("Connection refused"));

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database.status).toBe("error");
      expect(data.checks.database.message).toBeDefined();
    });

    it("should include database latency when healthy", async () => {
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.checks.database.latency).toBeDefined();
      expect(typeof data.checks.database.latency).toBe("number");
    });

    it("should check Redis when configured", async () => {
      process.env.REDIS_URL = "redis://localhost:6379";
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.checks.redis).toBeDefined();
      expect(data.checks.redis?.status).toBe("ok");
    });

    it("should check storage when configured", async () => {
      process.env.S3_ENDPOINT = "http://localhost:9000";
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.checks.storage).toBeDefined();
      expect(data.checks.storage?.status).toBe("ok");
    });

    it("should complete health check quickly", async () => {
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const startTime = Date.now();
      await GET();
      const endTime = Date.now();

      // Health check should complete quickly
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Health Status Logic", () => {
    it("should be healthy when database is ok and optional services unconfigured", async () => {
      mockDbExecute.mockResolvedValue([{ "?column?": 1 }] as never);

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.status).toBe("healthy");
    });

    it("should be unhealthy when database fails", async () => {
      mockDbExecute.mockRejectedValue(new Error("DB Error"));

      const response = await GET();
      const data: HealthResponse = await response.json();

      expect(data.status).toBe("unhealthy");
      expect(response.status).toBe(503);
    });
  });
});
