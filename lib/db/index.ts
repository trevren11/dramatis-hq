import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://build:build@localhost:5432/build";

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export type Database = typeof db;

// Re-export safe query utilities
export { safeQuery, safeQueryWithDefault, type SafeQueryResult } from "./safe-query";
