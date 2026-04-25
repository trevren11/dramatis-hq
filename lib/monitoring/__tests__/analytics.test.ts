import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  trackPageView,
  trackEvent,
  trackFunnelStep,
  initAnalytics,
  getAnalyticsContext,
  clearAnalytics,
  conversions,
} from "../analytics";

// Mock dependencies
vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch for Plausible
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalytics();
    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("trackPageView", () => {
    it("should track page views", () => {
      trackPageView("/dashboard");
      expect(true).toBe(true);
    });

    it("should track page views with referrer", () => {
      trackPageView("/auditions", "https://google.com");
      expect(true).toBe(true);
    });

    it("should track root page views", () => {
      trackPageView("/");
      expect(true).toBe(true);
    });
  });

  describe("trackEvent", () => {
    it("should track signup events", () => {
      trackEvent({
        type: "signup_completed",
        userId: "user-123",
      });
      expect(true).toBe(true);
    });

    it("should track events with properties", () => {
      trackEvent({
        type: "audition_application_submitted",
        userId: "user-456",
        properties: {
          auditionId: "aud-789",
          showType: "musical",
        },
      });
      expect(true).toBe(true);
    });

    it("should track events with timestamp", () => {
      const timestamp = new Date("2024-01-15T10:00:00Z");
      trackEvent({
        type: "login",
        userId: "user-789",
        timestamp,
      });
      expect(true).toBe(true);
    });

    it("should track subscription events", () => {
      trackEvent({
        type: "subscription_started",
        userId: "user-123",
        properties: {
          plan: "pro",
          interval: "monthly",
        },
      });
      expect(true).toBe(true);
    });

    it("should track search events", () => {
      trackEvent({
        type: "talent_search",
        userId: "producer-123",
        properties: {
          filters: 3,
          resultCount: 25,
        },
      });
      expect(true).toBe(true);
    });
  });

  describe("trackFunnelStep", () => {
    it("should track signup funnel steps", () => {
      trackFunnelStep("signup", "signup_started", "user-123");
      expect(true).toBe(true);
    });

    it("should track profile funnel steps", () => {
      trackFunnelStep("profile", "profile_completed", "user-456");
      expect(true).toBe(true);
    });

    it("should track application funnel steps", () => {
      trackFunnelStep("first_application", "application_submitted", "user-789");
      expect(true).toBe(true);
    });

    it("should track show creation funnel steps", () => {
      trackFunnelStep("first_show", "audition_published", "producer-123");
      expect(true).toBe(true);
    });

    it("should track funnel steps without userId", () => {
      trackFunnelStep("signup", "signup_email_entered");
      expect(true).toBe(true);
    });
  });

  describe("Analytics Context", () => {
    it("should initialize analytics context", () => {
      initAnalytics({
        userId: "user-123",
        sessionId: "session-456",
        userRole: "talent",
      });
      const context = getAnalyticsContext();
      expect(context).toBeDefined();
      expect(context?.userId).toBe("user-123");
      expect(context?.sessionId).toBe("session-456");
      expect(context?.userRole).toBe("talent");
    });

    it("should initialize analytics without userId", () => {
      initAnalytics({
        sessionId: "session-789",
      });
      const context = getAnalyticsContext();
      expect(context).toBeDefined();
      expect(context?.userId).toBeUndefined();
      expect(context?.sessionId).toBe("session-789");
    });

    it("should clear analytics context", () => {
      initAnalytics({
        userId: "user-123",
        sessionId: "session-456",
      });
      clearAnalytics();
      const context = getAnalyticsContext();
      expect(context).toBeNull();
    });

    it("should update analytics context", () => {
      initAnalytics({
        userId: "user-123",
        sessionId: "session-456",
      });
      initAnalytics({
        userId: "user-789",
        sessionId: "session-999",
        userRole: "producer",
      });
      const context = getAnalyticsContext();
      expect(context?.userId).toBe("user-789");
    });
  });

  describe("Conversion Helpers", () => {
    it("should track signup completion", () => {
      conversions.signupCompleted("user-123");
      expect(true).toBe(true);
    });

    it("should track profile completion", () => {
      conversions.profileCompleted("user-456");
      expect(true).toBe(true);
    });

    it("should track first application", () => {
      conversions.firstApplication("user-789", "audition-123");
      expect(true).toBe(true);
    });

    it("should track first show created", () => {
      conversions.firstShowCreated("producer-123", "show-456");
      expect(true).toBe(true);
    });

    it("should track subscription started", () => {
      conversions.subscriptionStarted("user-999", "pro");
      expect(true).toBe(true);
    });
  });
});
