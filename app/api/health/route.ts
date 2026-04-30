export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { logger } from "@/lib/monitoring/logger";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface ServiceCheck {
  status: "ok" | "error";
  latency?: number;
  message?: string;
}

export interface SchemaCheck {
  status: "ok" | "error";
  missingColumns?: string[];
  message?: string;
}

export interface HealthResponse {
  status: HealthStatus;
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: ServiceCheck;
    schema?: SchemaCheck;
    redis?: ServiceCheck;
    storage?: ServiceCheck;
  };
}

const startTime = Date.now();

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      status: "ok",
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.error("Database health check failed", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return {
      status: "error",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Critical columns that have caused issues in the past.
 * If any of these are missing, the schema check will fail.
 *
 * Add columns here that have previously been missing after deploys.
 * This serves as a quick sanity check - for comprehensive validation,
 * run 'pnpm schema:validate' which checks ALL columns.
 */
const CRITICAL_COLUMNS: { table: string; column: string }[] = [
  // Core tables - must exist for app to function
  { table: "users", column: "id" },
  { table: "users", column: "email" },
  // Columns that have been missing in past deploys (see issue #99)
  { table: "resume_configurations", column: "template" },
  { table: "talent_profiles", column: "weight_lbs" },
  { table: "talent_profiles", column: "willingness_to_change_hair" },
  { table: "talent_profiles", column: "metric_visibility" },
];

async function checkSchema(): Promise<SchemaCheck> {
  try {
    const missingColumns: string[] = [];

    for (const { table, column } of CRITICAL_COLUMNS) {
      const result = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ${table} AND column_name = ${column}
      `);

      if (result.length === 0) {
        missingColumns.push(`${table}.${column}`);
      }
    }

    if (missingColumns.length > 0) {
      logger.warn("Schema check found missing columns", { missingColumns });
      return {
        status: "error",
        missingColumns,
        message: `Missing columns: ${missingColumns.join(", ")}`,
      };
    }

    return { status: "ok" };
  } catch (error) {
    logger.error("Schema check failed", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Schema check failed",
    };
  }
}

function checkRedis(): ServiceCheck {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return {
      status: "ok",
      message: "Redis not configured",
    };
  }

  // For now, just check if REDIS_URL is set
  // In a real implementation, you would ping the Redis server
  return {
    status: "ok",
    message: "Redis configured",
  };
}

function checkStorage(): ServiceCheck {
  const s3Endpoint = process.env.S3_ENDPOINT;
  if (!s3Endpoint) {
    return {
      status: "ok",
      message: "S3 not configured",
    };
  }

  // For now, just check if S3 is configured
  // In a real implementation, you would list buckets or check accessibility
  return {
    status: "ok",
    message: "S3 configured",
  };
}

function determineOverallStatus(checks: HealthResponse["checks"]): HealthStatus {
  // If database is down, system is unhealthy
  if (checks.database.status === "error") {
    return "unhealthy";
  }

  // Schema errors are degraded - app can partially function
  if (checks.schema?.status === "error") {
    return "degraded";
  }

  // Check other services
  const otherChecks = [checks.redis, checks.storage].filter(Boolean);
  if (otherChecks.some((check) => check?.status === "error")) {
    return "degraded";
  }

  return "healthy";
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const database = await checkDatabase();
  const redis = checkRedis();
  const storage = checkStorage();

  // Only check schema if database is healthy
  const schema = database.status === "ok" ? await checkSchema() : undefined;

  const checks = {
    database,
    schema,
    redis,
    storage,
  };

  const status = determineOverallStatus(checks);

  const response: HealthResponse = {
    status,
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "development",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  const httpStatus = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

  logger.info("Health check performed", {
    status,
    checks: {
      database: database.status,
      schema: schema?.status,
      redis: redis.status,
      storage: storage.status,
    },
  });

  return NextResponse.json(response, { status: httpStatus });
}
