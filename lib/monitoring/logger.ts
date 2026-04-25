import pino from "pino";

// Sensitive fields to redact from logs
const REDACT_PATHS = [
  "password",
  "token",
  "authorization",
  "cookie",
  "apiKey",
  "api_key",
  "secret",
  "creditCard",
  "credit_card",
  "ssn",
  "social_security",
  "*.password",
  "*.token",
  "*.authorization",
  "*.cookie",
  "*.apiKey",
  "*.api_key",
  "*.secret",
  "headers.authorization",
  "headers.cookie",
  "body.password",
  "body.token",
  "req.headers.authorization",
  "req.headers.cookie",
];

// Create the base logger
const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid as number,
      host: bindings.hostname as string,
      env: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "development",
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Use pino-pretty in development
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  [key: string]: unknown;
}

/**
 * Logger interface for structured logging
 */
export const logger = {
  /**
   * Debug level logging - for development debugging
   */
  debug: (message: string, context?: LogContext) => {
    baseLogger.debug(context ?? {}, message);
  },

  /**
   * Info level logging - for general information
   */
  info: (message: string, context?: LogContext) => {
    baseLogger.info(context ?? {}, message);
  },

  /**
   * Warning level logging - for non-critical issues
   */
  warn: (message: string, context?: LogContext) => {
    baseLogger.warn(context ?? {}, message);
  },

  /**
   * Error level logging - for errors and exceptions
   */
  error: (message: string, context?: LogContext) => {
    const errorContext = context?.error
      ? {
          ...context,
          error: {
            name: context.error.name,
            message: context.error.message,
            stack: context.error.stack,
          },
        }
      : context;
    baseLogger.error(errorContext ?? {}, message);
  },

  /**
   * Create a child logger with bound context
   */
  child: (bindings: Record<string, unknown>) => {
    const childLogger = baseLogger.child(bindings);
    return {
      debug: (message: string, context?: LogContext) => {
        childLogger.debug(context ?? {}, message);
      },
      info: (message: string, context?: LogContext) => {
        childLogger.info(context ?? {}, message);
      },
      warn: (message: string, context?: LogContext) => {
        childLogger.warn(context ?? {}, message);
      },
      error: (message: string, context?: LogContext) => {
        const errorContext = context?.error
          ? {
              ...context,
              error: {
                name: context.error.name,
                message: context.error.message,
                stack: context.error.stack,
              },
            }
          : context;
        childLogger.error(errorContext ?? {}, message);
      },
    };
  },
};

/**
 * Request logging data
 */
export interface RequestLogData {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Log an HTTP request
 */
export function logRequest(data: RequestLogData): void {
  const level = data.statusCode >= 500 ? "error" : data.statusCode >= 400 ? "warn" : "info";

  const message = `${data.method} ${data.url} ${String(data.statusCode)} ${String(data.duration)}ms`;

  logger[level](message, {
    method: data.method,
    path: data.url,
    statusCode: data.statusCode,
    duration: data.duration,
    userId: data.userId,
    requestId: data.requestId,
    userAgent: data.userAgent,
    ip: data.ip,
  });
}

/**
 * Log database query performance
 */
export function logQuery(query: string, duration: number, context?: { userId?: string }): void {
  const isSlow = duration > 1000;

  if (isSlow) {
    logger.warn("Slow database query detected", {
      query: query.slice(0, 200), // Truncate long queries
      duration,
      userId: context?.userId,
    });
  } else if (process.env.NODE_ENV !== "production") {
    logger.debug("Database query", {
      query: query.slice(0, 200),
      duration,
    });
  }
}

/**
 * Log audit event for sensitive operations
 */
export interface AuditEvent {
  action: string;
  userId: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

export function logAudit(event: AuditEvent): void {
  logger.info(`Audit: ${event.action}`, {
    action: event.action,
    userId: event.userId,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    details: event.details,
    ip: event.ip,
  });
}

export default logger;
