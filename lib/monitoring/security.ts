import * as Sentry from "@sentry/nextjs";
import { logger, logAudit } from "./logger";

/**
 * Security event types
 */
export type SecurityEventType =
  | "login_failed"
  | "login_success"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_changed"
  | "rate_limit_exceeded"
  | "suspicious_activity"
  | "permission_denied"
  | "session_expired"
  | "account_locked"
  | "account_unlocked"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "api_key_created"
  | "api_key_revoked";

/**
 * Security event data
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Failed login attempt tracking
 */
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

const FAILED_LOGIN_THRESHOLD = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ACCOUNT_LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Log a security event
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const { type, userId, email, ip, userAgent, details, severity } = event;

  // Log to structured logger
  const logLevel = severity === "critical" || severity === "high" ? "error" : "warn";
  logger[logLevel](`Security: ${type}`, {
    type,
    userId,
    email,
    ip,
    userAgent,
    details,
    severity,
  });

  // Send to Sentry for high severity events
  if (severity === "high" || severity === "critical") {
    Sentry.captureMessage(`Security event: ${type}`, {
      level: severity === "critical" ? "error" : "warning",
      tags: {
        securityEvent: type,
        severity,
      },
      extra: {
        userId,
        email,
        ip,
        details,
      },
    });
  }

  // Log audit trail for sensitive actions
  if (userId) {
    logAudit({
      action: type,
      userId,
      resourceType: "security",
      details,
      ip,
    });
  }
}

/**
 * Track a failed login attempt
 * Returns true if account should be locked
 */
export function trackFailedLogin(identifier: string, ip?: string): boolean {
  const key = identifier.toLowerCase();
  const now = new Date();

  // Get or create tracking entry
  let attempts = failedLoginAttempts.get(key);

  if (!attempts || now.getTime() - attempts.lastAttempt.getTime() > FAILED_LOGIN_WINDOW_MS) {
    // Reset if outside window
    attempts = { count: 0, lastAttempt: now };
  }

  attempts.count++;
  attempts.lastAttempt = now;
  failedLoginAttempts.set(key, attempts);

  // Log the failed attempt
  logSecurityEvent({
    type: "login_failed",
    email: identifier,
    ip,
    details: {
      attemptCount: attempts.count,
    },
    severity: attempts.count >= FAILED_LOGIN_THRESHOLD ? "high" : "medium",
  });

  // Check if account should be locked
  if (attempts.count >= FAILED_LOGIN_THRESHOLD) {
    logSecurityEvent({
      type: "account_locked",
      email: identifier,
      ip,
      details: {
        lockDurationMs: ACCOUNT_LOCK_DURATION_MS,
        attemptCount: attempts.count,
      },
      severity: "high",
    });
    return true;
  }

  return false;
}

/**
 * Check if an account is currently locked
 */
export function isAccountLocked(identifier: string): boolean {
  const key = identifier.toLowerCase();
  const attempts = failedLoginAttempts.get(key);

  if (!attempts) {
    return false;
  }

  const now = new Date();
  const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();

  // Account is locked if threshold exceeded and within lock duration
  if (attempts.count >= FAILED_LOGIN_THRESHOLD && timeSinceLastAttempt < ACCOUNT_LOCK_DURATION_MS) {
    return true;
  }

  // Clear old attempts
  if (timeSinceLastAttempt > FAILED_LOGIN_WINDOW_MS) {
    failedLoginAttempts.delete(key);
  }

  return false;
}

/**
 * Clear failed login attempts (on successful login)
 */
export function clearFailedLogins(identifier: string): void {
  const key = identifier.toLowerCase();
  failedLoginAttempts.delete(key);
}

/**
 * Track a successful login
 */
export function trackSuccessfulLogin(
  userId: string,
  email: string,
  ip?: string,
  userAgent?: string
): void {
  clearFailedLogins(email);

  logSecurityEvent({
    type: "login_success",
    userId,
    email,
    ip,
    userAgent,
    severity: "low",
  });
}

/**
 * Rate limiting tracking
 */
const rateLimitTracking = new Map<string, { count: number; windowStart: Date }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Track rate limit violation
 */
export function trackRateLimitViolation(
  identifier: string,
  endpoint: string,
  limit: number,
  ip?: string
): void {
  const key = `${identifier}:${endpoint}`;
  const now = new Date();

  let tracking = rateLimitTracking.get(key);

  if (!tracking || now.getTime() - tracking.windowStart.getTime() > RATE_LIMIT_WINDOW_MS) {
    tracking = { count: 0, windowStart: now };
  }

  tracking.count++;
  rateLimitTracking.set(key, tracking);

  logSecurityEvent({
    type: "rate_limit_exceeded",
    ip,
    details: {
      identifier,
      endpoint,
      limit,
      currentCount: tracking.count,
    },
    severity: tracking.count > limit * 2 ? "high" : "medium",
  });
}

/**
 * Track suspicious activity
 */
export function trackSuspiciousActivity(
  description: string,
  details: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    indicators?: string[];
  }
): void {
  logSecurityEvent({
    type: "suspicious_activity",
    userId: details.userId,
    ip: details.ip,
    userAgent: details.userAgent,
    details: {
      description,
      indicators: details.indicators,
    },
    severity: "high",
  });
}

/**
 * Track permission denied
 */
export function trackPermissionDenied(
  userId: string,
  resource: string,
  action: string,
  ip?: string
): void {
  logSecurityEvent({
    type: "permission_denied",
    userId,
    ip,
    details: {
      resource,
      action,
    },
    severity: "medium",
  });
}

/**
 * Audit log for sensitive operations
 */
export type AuditAction =
  | "user_created"
  | "user_deleted"
  | "user_role_changed"
  | "password_changed"
  | "email_changed"
  | "profile_updated"
  | "show_created"
  | "show_deleted"
  | "show_published"
  | "audition_created"
  | "audition_deleted"
  | "casting_decision"
  | "subscription_changed"
  | "settings_changed"
  | "data_exported"
  | "data_deleted";

export interface AuditLogEntry {
  action: AuditAction;
  userId: string;
  targetUserId?: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  ip?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export function createAuditLog(entry: AuditLogEntry): void {
  logAudit({
    action: entry.action,
    userId: entry.userId,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    details: {
      targetUserId: entry.targetUserId,
      changes: entry.changes,
      userAgent: entry.userAgent,
    },
    ip: entry.ip,
  });

  // Also log to Sentry for critical actions
  const criticalActions: AuditAction[] = [
    "user_deleted",
    "user_role_changed",
    "data_deleted",
    "subscription_changed",
  ];

  if (criticalActions.includes(entry.action)) {
    Sentry.captureMessage(`Audit: ${entry.action}`, {
      level: "info",
      tags: {
        auditAction: entry.action,
        resourceType: entry.resourceType,
      },
      extra: {
        userId: entry.userId,
        targetUserId: entry.targetUserId,
        resourceId: entry.resourceId,
        changes: entry.changes,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    });
  }
}

/**
 * Get remaining lockout time in seconds
 */
export function getRemainingLockoutTime(identifier: string): number {
  const key = identifier.toLowerCase();
  const attempts = failedLoginAttempts.get(key);

  if (!attempts || attempts.count < FAILED_LOGIN_THRESHOLD) {
    return 0;
  }

  const elapsed = Date.now() - attempts.lastAttempt.getTime();
  const remaining = ACCOUNT_LOCK_DURATION_MS - elapsed;

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
