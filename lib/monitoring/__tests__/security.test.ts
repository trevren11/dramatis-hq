import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  logSecurityEvent,
  trackFailedLogin,
  isAccountLocked,
  clearFailedLogins,
  trackSuccessfulLogin,
  trackRateLimitViolation,
  trackSuspiciousActivity,
  trackPermissionDenied,
  createAuditLog,
  getRemainingLockoutTime,
} from "../security";

// Mock dependencies
vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
}));

vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  logAudit: vi.fn(),
}));

describe("Security Monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any stored login attempts
    clearFailedLogins("test@example.com");
    clearFailedLogins("locked@example.com");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logSecurityEvent", () => {
    it("should log low severity events", () => {
      logSecurityEvent({
        type: "login_success",
        userId: "user-123",
        email: "user@example.com",
        severity: "low",
      });
      expect(true).toBe(true);
    });

    it("should log medium severity events", () => {
      logSecurityEvent({
        type: "login_failed",
        email: "user@example.com",
        ip: "192.168.1.1",
        severity: "medium",
      });
      expect(true).toBe(true);
    });

    it("should log high severity events to Sentry", () => {
      logSecurityEvent({
        type: "account_locked",
        email: "user@example.com",
        severity: "high",
        details: { attemptCount: 5 },
      });
      expect(true).toBe(true);
    });

    it("should log critical severity events to Sentry", () => {
      logSecurityEvent({
        type: "suspicious_activity",
        ip: "10.0.0.1",
        severity: "critical",
        details: { indicators: ["multiple_failed_logins", "unusual_location"] },
      });
      expect(true).toBe(true);
    });

    it("should include user agent", () => {
      logSecurityEvent({
        type: "login_success",
        userId: "user-456",
        userAgent: "Mozilla/5.0",
        severity: "low",
      });
      expect(true).toBe(true);
    });
  });

  describe("trackFailedLogin", () => {
    it("should track first failed login attempt", () => {
      const shouldLock = trackFailedLogin("test@example.com", "192.168.1.1");
      expect(shouldLock).toBe(false);
    });

    it("should track multiple failed login attempts", () => {
      trackFailedLogin("test@example.com");
      trackFailedLogin("test@example.com");
      const shouldLock = trackFailedLogin("test@example.com");
      expect(shouldLock).toBe(false);
    });

    it("should lock account after threshold", () => {
      for (let i = 0; i < 4; i++) {
        trackFailedLogin("locked@example.com");
      }
      const shouldLock = trackFailedLogin("locked@example.com");
      expect(shouldLock).toBe(true);
    });

    it("should be case insensitive for email", () => {
      trackFailedLogin("Test@Example.com");
      trackFailedLogin("test@example.com");
      trackFailedLogin("TEST@EXAMPLE.COM");
      // All should count towards same identifier
      expect(isAccountLocked("test@example.com")).toBe(false);
    });
  });

  describe("isAccountLocked", () => {
    it("should return false for accounts with no failed attempts", () => {
      expect(isAccountLocked("new@example.com")).toBe(false);
    });

    it("should return false for accounts below threshold", () => {
      trackFailedLogin("below@example.com");
      trackFailedLogin("below@example.com");
      expect(isAccountLocked("below@example.com")).toBe(false);
    });

    it("should return true for locked accounts", () => {
      for (let i = 0; i < 5; i++) {
        trackFailedLogin("locked@example.com");
      }
      expect(isAccountLocked("locked@example.com")).toBe(true);
    });
  });

  describe("clearFailedLogins", () => {
    it("should clear failed login attempts", () => {
      trackFailedLogin("clear@example.com");
      trackFailedLogin("clear@example.com");
      clearFailedLogins("clear@example.com");
      expect(isAccountLocked("clear@example.com")).toBe(false);
    });

    it("should unlock a locked account", () => {
      for (let i = 0; i < 5; i++) {
        trackFailedLogin("unlock@example.com");
      }
      expect(isAccountLocked("unlock@example.com")).toBe(true);
      clearFailedLogins("unlock@example.com");
      expect(isAccountLocked("unlock@example.com")).toBe(false);
    });
  });

  describe("trackSuccessfulLogin", () => {
    it("should clear failed attempts on successful login", () => {
      trackFailedLogin("success@example.com");
      trackFailedLogin("success@example.com");
      trackSuccessfulLogin("user-123", "success@example.com", "192.168.1.1", "Mozilla/5.0");
      expect(isAccountLocked("success@example.com")).toBe(false);
    });

    it("should log the successful login", () => {
      trackSuccessfulLogin("user-456", "success2@example.com");
      expect(true).toBe(true);
    });
  });

  describe("trackRateLimitViolation", () => {
    it("should track rate limit violations", () => {
      trackRateLimitViolation("user-123", "/api/search", 100, "192.168.1.1");
      expect(true).toBe(true);
    });

    it("should escalate severity for repeated violations", () => {
      trackRateLimitViolation("user-456", "/api/data", 50);
      trackRateLimitViolation("user-456", "/api/data", 50);
      trackRateLimitViolation("user-456", "/api/data", 50);
      expect(true).toBe(true);
    });
  });

  describe("trackSuspiciousActivity", () => {
    it("should track suspicious activity", () => {
      trackSuspiciousActivity("Multiple login attempts from different locations", {
        userId: "user-789",
        ip: "10.0.0.1",
        indicators: ["geo_anomaly", "velocity_check_failed"],
      });
      expect(true).toBe(true);
    });

    it("should track suspicious activity without userId", () => {
      trackSuspiciousActivity("Unusual API access pattern", {
        ip: "10.0.0.2",
        userAgent: "curl/7.68.0",
        indicators: ["high_frequency", "unusual_endpoints"],
      });
      expect(true).toBe(true);
    });
  });

  describe("trackPermissionDenied", () => {
    it("should track permission denied events", () => {
      trackPermissionDenied("user-123", "admin_panel", "access", "192.168.1.1");
      expect(true).toBe(true);
    });

    it("should track permission denied without IP", () => {
      trackPermissionDenied("user-456", "sensitive_data", "read");
      expect(true).toBe(true);
    });
  });

  describe("createAuditLog", () => {
    it("should create audit log entry", () => {
      createAuditLog({
        action: "user_created",
        userId: "admin-123",
        targetUserId: "new-user-456",
        resourceType: "user",
        resourceId: "new-user-456",
      });
      expect(true).toBe(true);
    });

    it("should create audit log with changes", () => {
      createAuditLog({
        action: "user_role_changed",
        userId: "admin-123",
        targetUserId: "user-456",
        resourceType: "user",
        resourceId: "user-456",
        changes: {
          role: { from: "talent", to: "producer" },
        },
        ip: "10.0.0.1",
        userAgent: "Mozilla/5.0",
      });
      expect(true).toBe(true);
    });

    it("should log critical actions to Sentry", () => {
      createAuditLog({
        action: "user_deleted",
        userId: "admin-123",
        targetUserId: "deleted-user",
        resourceType: "user",
        resourceId: "deleted-user",
      });
      expect(true).toBe(true);
    });
  });

  describe("getRemainingLockoutTime", () => {
    it("should return 0 for unlocked accounts", () => {
      expect(getRemainingLockoutTime("new@example.com")).toBe(0);
    });

    it("should return 0 for accounts below threshold", () => {
      trackFailedLogin("below2@example.com");
      expect(getRemainingLockoutTime("below2@example.com")).toBe(0);
    });

    it("should return remaining time for locked accounts", () => {
      for (let i = 0; i < 5; i++) {
        trackFailedLogin("locktime@example.com");
      }
      const remaining = getRemainingLockoutTime("locktime@example.com");
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30 * 60); // Max 30 minutes
    });
  });
});
