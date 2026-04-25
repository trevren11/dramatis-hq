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

export interface HealthResponse {
  status: HealthStatus;
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: ServiceCheck;
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
  const statuses = Object.values(checks);

  if (statuses.every((check) => check.status === "ok")) {
    return "healthy";
  }

  // If database is down, system is unhealthy
  if (checks.database.status === "error") {
    return "unhealthy";
  }

  // Other service failures result in degraded status
  if (statuses.some((check) => check.status === "error")) {
    return "degraded";
  }

  return "healthy";
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const database = await checkDatabase();
  const redis = checkRedis();
  const storage = checkStorage();

  const checks = {
    database,
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
      redis: redis.status,
      storage: storage.status,
    },
  });

  return NextResponse.json(response, { status: httpStatus });
}
