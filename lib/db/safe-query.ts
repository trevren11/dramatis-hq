import { logger } from "@/lib/monitoring/logger";

/**
 * Result of a safe database query
 */
export type SafeQueryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; isSchemaError: boolean };

/**
 * Wraps a database query with error handling.
 * Returns a result object instead of throwing, allowing graceful degradation.
 *
 * @example
 * const result = await safeQuery(
 *   () => db.query.users.findFirst({ where: eq(users.id, userId) }),
 *   "user-fetch"
 * );
 *
 * if (result.success) {
 *   // Use result.data
 * } else {
 *   // Handle error gracefully
 * }
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  context: string
): Promise<SafeQueryResult<T>> {
  try {
    const data = await queryFn();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Detect schema-related errors (missing columns, tables, etc.)
    const isSchemaError =
      errorMessage.includes("column") ||
      errorMessage.includes("relation") ||
      errorMessage.includes("does not exist") ||
      errorMessage.includes("undefined column");

    // Log the error with context
    logger.error(`Safe query failed: ${context}`, {
      error: error instanceof Error ? error : new Error(errorMessage),
      context,
      isSchemaError,
    });

    return {
      success: false,
      error: errorMessage,
      isSchemaError,
    };
  }
}

/**
 * Wraps a database query and returns a default value on error.
 * Useful when you want to continue rendering with fallback data.
 *
 * @example
 * const configs = await safeQueryWithDefault(
 *   () => db.query.resumeConfigurations.findMany({ where: eq(...) }),
 *   [],
 *   "resume-configs-fetch"
 * );
 */
export async function safeQueryWithDefault<T>(
  queryFn: () => Promise<T>,
  defaultValue: T,
  context: string
): Promise<T> {
  const result = await safeQuery(queryFn, context);
  return result.success ? result.data : defaultValue;
}
