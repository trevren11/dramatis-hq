import * as Sentry from "@sentry/nextjs";

export interface UserContext {
  id: string;
  email?: string;
  role?: string;
  organizationId?: string;
}

/**
 * Set user context for Sentry error tracking
 */
export function setUserContext(user: UserContext | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture an error with additional context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  });
}

/**
 * Capture a message with additional context
 */
export function captureMessage(
  message: string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string {
  return Sentry.captureMessage(message, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level ?? "info",
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}): void {
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level ?? "info",
    data: breadcrumb.data,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string): ReturnType<typeof Sentry.startSpan> {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    (span) => span
  );
}

/**
 * Wrap an async function with error capture
 */
export async function withErrorCapture<T>(
  fn: () => Promise<T>,
  context?: {
    operation: string;
    tags?: Record<string, string>;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      tags: {
        operation: context?.operation ?? "unknown",
        ...context?.tags,
      },
    });
    throw error;
  }
}

/**
 * Create a monitored API handler wrapper
 */
export function withMonitoring<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T,
  options?: {
    name?: string;
    tags?: Record<string, string>;
  }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const handlerName = handler.name || "anonymous";
    const transactionName = options?.name ?? handlerName;

    return await Sentry.startSpan(
      {
        name: transactionName,
        op: "http.server",
        attributes: options?.tags,
      },
      async (): Promise<ReturnType<T>> => {
        try {
          const handlerResult = await handler(...args);
          // eslint-disable-next-line @typescript-eslint/return-await
          return handlerResult as ReturnType<T>;
        } catch (error) {
          captureError(error instanceof Error ? error : new Error(String(error)), {
            tags: {
              handler: transactionName,
              ...options?.tags,
            },
          });
          throw error;
        }
      }
    );
  }) as T;
}
