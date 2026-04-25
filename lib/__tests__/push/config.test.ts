import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock web-push before importing config
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

describe("Push Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isPushConfigured", () => {
    it("returns false when VAPID keys not set", async () => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;

      const { isPushConfigured } = await import("../../push/config");
      expect(isPushConfigured()).toBe(false);
    });

    it("returns false when only public key is set", async () => {
      process.env.VAPID_PUBLIC_KEY = "test-public-key";
      delete process.env.VAPID_PRIVATE_KEY;

      const { isPushConfigured } = await import("../../push/config");
      expect(isPushConfigured()).toBe(false);
    });

    it("returns false when only private key is set", async () => {
      delete process.env.VAPID_PUBLIC_KEY;
      process.env.VAPID_PRIVATE_KEY = "test-private-key";

      const { isPushConfigured } = await import("../../push/config");
      expect(isPushConfigured()).toBe(false);
    });

    it("returns true when both VAPID keys are set", async () => {
      process.env.VAPID_PUBLIC_KEY = "test-public-key";
      process.env.VAPID_PRIVATE_KEY = "test-private-key";

      const { isPushConfigured } = await import("../../push/config");
      expect(isPushConfigured()).toBe(true);
    });
  });

  describe("vapidConfig", () => {
    it("uses environment variables", async () => {
      process.env.VAPID_PUBLIC_KEY = "my-public-key";
      process.env.VAPID_PRIVATE_KEY = "my-private-key";
      process.env.VAPID_SUBJECT = "mailto:custom@example.com";

      const { vapidConfig } = await import("../../push/config");

      expect(vapidConfig.publicKey).toBe("my-public-key");
      expect(vapidConfig.privateKey).toBe("my-private-key");
      expect(vapidConfig.subject).toBe("mailto:custom@example.com");
    });

    it("uses default subject when not set", async () => {
      process.env.VAPID_PUBLIC_KEY = "test-key";
      process.env.VAPID_PRIVATE_KEY = "test-key";
      delete process.env.VAPID_SUBJECT;

      const { vapidConfig } = await import("../../push/config");

      expect(vapidConfig.subject).toBe("mailto:admin@dramatis-hq.com");
    });
  });
});
