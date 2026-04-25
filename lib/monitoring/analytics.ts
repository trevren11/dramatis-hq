import { logger } from "./logger";

/**
 * Analytics event types for the application
 */
export type AnalyticsEventType =
  // Page views
  | "page_view"
  // User events
  | "signup_started"
  | "signup_completed"
  | "login"
  | "logout"
  // Profile events
  | "profile_updated"
  | "profile_completed"
  | "headshot_uploaded"
  | "resume_generated"
  // Audition events
  | "audition_created"
  | "audition_published"
  | "audition_application_started"
  | "audition_application_submitted"
  | "audition_checkin"
  // Show events
  | "show_created"
  | "show_published"
  | "casting_decision"
  // Callback events
  | "callback_scheduled"
  | "callback_invitation_sent"
  // Subscription events
  | "subscription_started"
  | "subscription_cancelled"
  | "subscription_renewed"
  // Search events
  | "talent_search"
  | "audition_search";

/**
 * Analytics event properties
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  userId?: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: Date;
}

/**
 * Conversion funnel steps
 */
export type FunnelStep =
  // Signup funnel
  | "signup_started"
  | "signup_email_entered"
  | "signup_password_entered"
  | "signup_submitted"
  | "signup_verified"
  // Profile completion funnel
  | "profile_started"
  | "profile_basic_info"
  | "profile_headshot"
  | "profile_resume"
  | "profile_completed"
  // First audition application funnel
  | "audition_viewed"
  | "application_started"
  | "application_form_filled"
  | "application_submitted"
  // First show creation funnel
  | "show_creation_started"
  | "show_details_entered"
  | "audition_created"
  | "audition_published";

/**
 * Privacy-respecting analytics configuration
 */
const ANALYTICS_CONFIG = {
  // Only track on production
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  // Plausible analytics URL (optional)
  plausibleUrl: process.env.NEXT_PUBLIC_PLAUSIBLE_URL,
  // Domain for Plausible
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
};

/**
 * Track a page view (privacy-respecting)
 */
export function trackPageView(path: string, referrer?: string): void {
  if (!ANALYTICS_CONFIG.enabled) {
    logger.debug("Analytics: page_view (disabled)", { path, referrer });
    return;
  }

  // Send to Plausible if configured
  if (ANALYTICS_CONFIG.plausibleUrl && typeof window !== "undefined") {
    sendToPlausible("pageview", { path, referrer });
  }

  logger.info("Analytics: page_view", { path, referrer });
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  const { type, userId, properties, timestamp = new Date() } = event;

  // Always log for debugging
  logger.info(`Analytics: ${type}`, {
    type,
    userId,
    properties,
    timestamp: timestamp.toISOString(),
  });

  if (!ANALYTICS_CONFIG.enabled) {
    return;
  }

  // Send to Plausible if configured
  if (ANALYTICS_CONFIG.plausibleUrl && typeof window !== "undefined") {
    sendToPlausible(type, properties);
  }
}

/**
 * Track a funnel step
 */
export function trackFunnelStep(
  funnel: "signup" | "profile" | "first_application" | "first_show",
  step: FunnelStep,
  userId?: string
): void {
  trackEvent({
    type: step as AnalyticsEventType,
    userId,
    properties: {
      funnel,
      step,
    },
  });
}

/**
 * Send event to Plausible Analytics
 */
function sendToPlausible(eventName: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !ANALYTICS_CONFIG.plausibleUrl) {
    return;
  }

  try {
    // Use the Plausible API
    fetch(`${ANALYTICS_CONFIG.plausibleUrl}/api/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: eventName,
        domain: ANALYTICS_CONFIG.plausibleDomain,
        url: window.location.href,
        referrer: document.referrer || null,
        props,
      }),
    }).catch(() => {
      // Silently fail - analytics should not break the app
    });
  } catch {
    // Silently fail
  }
}

/**
 * Analytics context for React
 * Contains user identification and session tracking
 */
export interface AnalyticsContext {
  userId?: string;
  sessionId: string;
  userRole?: "talent" | "producer" | "admin";
}

let analyticsContext: AnalyticsContext | null = null;

/**
 * Initialize analytics context
 */
export function initAnalytics(context: AnalyticsContext): void {
  analyticsContext = context;
  logger.debug("Analytics initialized", {
    userId: context.userId,
    sessionId: context.sessionId,
  });
}

/**
 * Get current analytics context
 */
export function getAnalyticsContext(): AnalyticsContext | null {
  return analyticsContext;
}

/**
 * Clear analytics context (on logout)
 */
export function clearAnalytics(): void {
  analyticsContext = null;
  logger.debug("Analytics cleared");
}

/**
 * Helper to track conversion events
 */
export const conversions = {
  signupCompleted: (userId: string) => {
    trackEvent({
      type: "signup_completed",
      userId,
      properties: {
        conversion: "signup",
      },
    });
  },

  profileCompleted: (userId: string) => {
    trackEvent({
      type: "profile_completed",
      userId,
      properties: {
        conversion: "profile_completion",
      },
    });
  },

  firstApplication: (userId: string, auditionId: string) => {
    trackEvent({
      type: "audition_application_submitted",
      userId,
      properties: {
        conversion: "first_application",
        auditionId,
      },
    });
  },

  firstShowCreated: (userId: string, showId: string) => {
    trackEvent({
      type: "show_created",
      userId,
      properties: {
        conversion: "first_show",
        showId,
      },
    });
  },

  subscriptionStarted: (userId: string, plan: string) => {
    trackEvent({
      type: "subscription_started",
      userId,
      properties: {
        conversion: "subscription",
        plan,
      },
    });
  },
};
