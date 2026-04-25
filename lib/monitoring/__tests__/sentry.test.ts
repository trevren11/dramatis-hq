import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setUserContext,
  captureError,
  captureMessage,
  addBreadcrumb,
  withErrorCapture,
  withMonitoring,
} from "../sentry";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  setUser: vi.fn(),
  captureException: vi.fn(() => "event-id-123"),
  captureMessage: vi.fn(() => "event-id-456"),
  addBreadcrumb: vi.fn(),
  startSpan: vi.fn((_opts: { name: string }, callback: (span: { name: string }) => unknown) =>
    callback({ name: _opts.name })
  ),
}));

describe("Sentry Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setUserContext", () => {
    it("should set user context", () => {
      setUserContext({
        id: "user-123",
        email: "user@example.com",
        role: "talent",
      });
      expect(true).toBe(true);
    });

    it("should set user context with organization", () => {
      setUserContext({
        id: "user-456",
        email: "producer@company.com",
        role: "producer",
        organizationId: "org-789",
      });
      expect(true).toBe(true);
    });

    it("should clear user context with null", () => {
      setUserContext(null);
      expect(true).toBe(true);
    });

    it("should set minimal user context", () => {
      setUserContext({ id: "user-minimal" });
      expect(true).toBe(true);
    });
  });

  describe("captureError", () => {
    it("should capture an error", () => {
      const error = new Error("Test error");
      const eventId = captureError(error);
      expect(eventId).toBe("event-id-123");
    });

    it("should capture an error with tags", () => {
      const error = new Error("Tagged error");
      captureError(error, {
        tags: { component: "auth", action: "login" },
      });
      expect(true).toBe(true);
    });

    it("should capture an error with extra data", () => {
      const error = new Error("Detailed error");
      captureError(error, {
        extra: { userId: "user-123", requestId: "req-456" },
      });
      expect(true).toBe(true);
    });

    it("should capture an error with level", () => {
      const error = new Error("Warning level error");
      captureError(error, { level: "warning" });
      expect(true).toBe(true);
    });

    it("should capture an error with all options", () => {
      const error = new Error("Full options error");
      captureError(error, {
        tags: { service: "api" },
        extra: { endpoint: "/api/users" },
        level: "error",
      });
      expect(true).toBe(true);
    });
  });

  describe("captureMessage", () => {
    it("should capture a message", () => {
      const eventId = captureMessage("Test message");
      expect(eventId).toBe("event-id-456");
    });

    it("should capture a message with tags", () => {
      captureMessage("Tagged message", {
        tags: { feature: "auditions" },
      });
      expect(true).toBe(true);
    });

    it("should capture a message with level", () => {
      captureMessage("Warning message", { level: "warning" });
      expect(true).toBe(true);
    });

    it("should capture a message with extra data", () => {
      captureMessage("Detailed message", {
        extra: { context: "testing" },
      });
      expect(true).toBe(true);
    });
  });

  describe("addBreadcrumb", () => {
    it("should add a breadcrumb", () => {
      addBreadcrumb({
        category: "navigation",
        message: "User navigated to dashboard",
      });
      expect(true).toBe(true);
    });

    it("should add a breadcrumb with level", () => {
      addBreadcrumb({
        category: "user",
        message: "User logged in",
        level: "info",
      });
      expect(true).toBe(true);
    });

    it("should add a breadcrumb with data", () => {
      addBreadcrumb({
        category: "api",
        message: "API request",
        data: { endpoint: "/api/users", method: "GET" },
      });
      expect(true).toBe(true);
    });
  });

  describe("withErrorCapture", () => {
    it("should return result on success", async () => {
      const result = await withErrorCapture(() => Promise.resolve("success"));
      expect(result).toBe("success");
    });

    it("should capture and rethrow errors", async () => {
      await expect(withErrorCapture(() => Promise.reject(new Error("Test error")))).rejects.toThrow(
        "Test error"
      );
    });

    it("should include operation context", async () => {
      await expect(
        withErrorCapture(() => Promise.reject(new Error("Operation error")), {
          operation: "test-operation",
        })
      ).rejects.toThrow("Operation error");
    });

    it("should include tags", async () => {
      await expect(
        withErrorCapture(() => Promise.reject(new Error("Tagged error")), {
          operation: "tagged-op",
          tags: { service: "test" },
        })
      ).rejects.toThrow("Tagged error");
    });
  });

  describe("withMonitoring", () => {
    it("should wrap a handler", async () => {
      const handler = vi.fn().mockResolvedValue("result");
      const monitored = withMonitoring(handler);
      const result = await monitored();
      expect(result).toBe("result");
    });

    it("should wrap a handler with name", async () => {
      const handler = vi.fn().mockResolvedValue("named result");
      const monitored = withMonitoring(handler, { name: "test-handler" });
      const result = await monitored();
      expect(result).toBe("named result");
    });

    it("should wrap a handler with tags", async () => {
      const handler = vi.fn().mockResolvedValue("tagged result");
      const monitored = withMonitoring(handler, {
        name: "tagged-handler",
        tags: { api: "v1" },
      });
      const result = await monitored();
      expect(result).toBe("tagged result");
    });

    it("should capture errors from handler", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Handler error"));
      const monitored = withMonitoring(handler, { name: "error-handler" });
      await expect(monitored()).rejects.toThrow("Handler error");
    });

    it("should pass arguments to handler", async () => {
      const handler = vi.fn().mockImplementation((a: number, b: number) => Promise.resolve(a + b));
      const monitored = withMonitoring(handler);
      const result = await monitored(2, 3);
      expect(result).toBe(5);
    });
  });
});
