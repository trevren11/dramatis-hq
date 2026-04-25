import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";

/**
 * Performance metric types
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count" | "ratio";
  timestamp: Date;
  tags?: Record<string, string>;
}

/**
 * Core Web Vitals types
 */
export interface WebVitalsMetric {
  name: "FCP" | "LCP" | "CLS" | "FID" | "TTFB" | "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType?: string;
  id: string;
}

/**
 * Performance budgets
 */
export const PERFORMANCE_BUDGETS = {
  // Time to First Byte
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // First Contentful Paint
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Largest Contentful Paint
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // Cumulative Layout Shift
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Input Delay
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Interaction to Next Paint
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  // API response times
  API_RESPONSE: {
    good: 200,
    needsImprovement: 1000,
  },
  // Database query times
  DB_QUERY: {
    good: 100,
    needsImprovement: 500,
  },
} as const;

/**
 * Rate a metric value against thresholds
 */
export function rateMetric(
  value: number,
  thresholds: { good: number; needsImprovement: number }
): "good" | "needs-improvement" | "poor" {
  if (value <= thresholds.good) {
    return "good";
  }
  if (value <= thresholds.needsImprovement) {
    return "needs-improvement";
  }
  return "poor";
}

/**
 * Report a Web Vital metric
 */
export function reportWebVital(metric: WebVitalsMetric): void {
  // Log the metric
  logger.info(`Web Vital: ${metric.name}`, {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });

  // Send to Sentry as a custom metric
  Sentry.setMeasurement(metric.name, metric.value, metric.name === "CLS" ? "" : "millisecond");

  // Alert on poor performance
  if (metric.rating === "poor") {
    logger.warn(`Poor Web Vital performance: ${metric.name}`, {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }
}

/**
 * Track API response time
 */
export function trackApiResponse(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
): void {
  const rating = rateMetric(duration, PERFORMANCE_BUDGETS.API_RESPONSE);

  logger.info("API response", {
    endpoint,
    method,
    duration,
    statusCode,
    rating,
  });

  // Send to Sentry
  Sentry.setMeasurement(`api.${method.toLowerCase()}.${endpoint}`, duration, "millisecond");

  // Alert on slow responses
  if (rating === "poor") {
    logger.warn("Slow API response detected", {
      endpoint,
      method,
      duration,
      statusCode,
      threshold: PERFORMANCE_BUDGETS.API_RESPONSE.needsImprovement,
    });
  }
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  rowCount?: number
): void {
  const rating = rateMetric(duration, PERFORMANCE_BUDGETS.DB_QUERY);

  logger.debug("Database query", {
    operation,
    table,
    duration,
    rowCount,
    rating,
  });

  // Alert on slow queries
  if (rating === "poor") {
    logger.warn("Slow database query detected", {
      operation,
      table,
      duration,
      rowCount,
      threshold: PERFORMANCE_BUDGETS.DB_QUERY.needsImprovement,
    });

    // Also send to Sentry
    Sentry.captureMessage(`Slow database query: ${operation} on ${table}`, {
      level: "warning",
      tags: {
        operation,
        table,
      },
      extra: {
        duration,
        rowCount,
      },
    });
  }
}

/**
 * Create a timer for measuring operations
 */
export function createTimer(): {
  end: () => number;
  elapsed: () => number;
} {
  const start = performance.now();

  return {
    end: () => Math.round(performance.now() - start),
    elapsed: () => Math.round(performance.now() - start),
  };
}

/**
 * Measure an async operation
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: {
    tags?: Record<string, string>;
    threshold?: number;
  }
): Promise<T> {
  const timer = createTimer();

  try {
    const result = await fn();
    const duration = timer.end();

    logger.debug(`Operation completed: ${operation}`, {
      operation,
      duration,
      ...options?.tags,
    });

    if (options?.threshold !== undefined && duration > options.threshold) {
      logger.warn(`Operation exceeded threshold: ${operation}`, {
        operation,
        duration,
        threshold: options.threshold,
        ...options.tags,
      });
    }

    return result;
  } catch (error) {
    const duration = timer.end();

    logger.error(`Operation failed: ${operation}`, {
      operation,
      duration,
      error: error instanceof Error ? error : new Error(String(error)),
      ...options?.tags,
    });

    throw error;
  }
}

/**
 * Client-side performance observer for Web Vitals
 * This should be called in a client component
 */
export function observeWebVitals(callback: (metric: WebVitalsMetric) => void): void {
  if (typeof window === "undefined") {
    return;
  }

  // Import web-vitals dynamically to avoid server-side issues
  import("web-vitals")
    .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const createHandler =
        (name: WebVitalsMetric["name"]) =>
        (metric: { value: number; rating: string; navigationType: string; id: string }) => {
          callback({
            name,
            value: metric.value,
            rating: metric.rating as WebVitalsMetric["rating"],
            navigationType: metric.navigationType,
            id: metric.id,
          });
        };

      onCLS(createHandler("CLS"));
      onFCP(createHandler("FCP"));
      onLCP(createHandler("LCP"));
      onTTFB(createHandler("TTFB"));
      onINP(createHandler("INP"));
    })
    .catch(() => {
      // web-vitals not available
    });
}
