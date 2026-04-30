#!/usr/bin/env tsx
/**
 * Schema Validation Script
 *
 * Dynamically compares Drizzle schema definitions to actual database columns.
 * This prevents deploy failures from missing columns by catching schema drift
 * before the app tries to query non-existent columns.
 *
 * Usage:
 *   pnpm schema:validate                    # Validate all tables
 *   pnpm schema:validate --table users      # Validate specific table
 *   pnpm schema:validate --verbose          # Show all columns, not just mismatches
 *
 * Exit codes:
 *   0 - Schema matches database
 *   1 - Schema mismatches found (missing columns in DB)
 *   2 - Connection or runtime error
 */

import postgres from "postgres";
import * as schema from "../lib/db/schema/index";
import { getTableName, getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
}

interface ValidationResult {
  table: string;
  schemaColumns: string[];
  dbColumns: string[];
  missingInDb: string[];
  extraInDb: string[];
}

async function getDbColumns(
  sql: postgres.Sql,
  tableName: string
): Promise<Map<string, ColumnInfo>> {
  const rows = await sql<
    {
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }[]
  >`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;

  const columns = new Map<string, ColumnInfo>();
  for (const row of rows) {
    columns.set(row.column_name, {
      name: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === "YES",
      columnDefault: row.column_default,
    });
  }
  return columns;
}

function getSchemaColumns(table: PgTable): string[] {
  const columns = getTableColumns(table);
  return Object.values(columns).map((col) => col.name);
}

function isTableObject(value: unknown): value is { _: { name: string } } {
  if (value === null || typeof value !== "object") return false;
  if (!("_" in value)) return false;
  // At this point we know value has property "_"
  const obj = value as Record<string, unknown>;
  const internal = obj._;
  if (internal === null || typeof internal !== "object") return false;
  const internalObj = internal as Record<string, unknown>;
  return "name" in internalObj && typeof internalObj.name === "string";
}

function extractTables(): Map<string, PgTable> {
  const tables = new Map<string, PgTable>();

  for (const value of Object.values(schema)) {
    if (isTableObject(value)) {
      try {
        // Cast through unknown since type guard only validates structure
        const table = value as unknown as PgTable;
        const tableName = getTableName(table);
        tables.set(tableName, table);
      } catch {
        // Not a table, skip
      }
    }
  }

  return tables;
}

async function validateTable(
  sql: postgres.Sql,
  tableName: string,
  table: PgTable
): Promise<ValidationResult> {
  const schemaColumns = getSchemaColumns(table);
  const dbColumnsMap = await getDbColumns(sql, tableName);
  const dbColumns = Array.from(dbColumnsMap.keys());

  const schemaSet = new Set(schemaColumns);
  const dbSet = new Set(dbColumns);

  const missingInDb = schemaColumns.filter((col) => !dbSet.has(col));
  const extraInDb = dbColumns.filter((col) => !schemaSet.has(col));

  return {
    table: tableName,
    schemaColumns,
    dbColumns,
    missingInDb,
    extraInDb,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose") || args.includes("-v");
  const tableIndex = args.indexOf("--table");
  const targetTable = tableIndex !== -1 ? args[tableIndex + 1] : null;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable not set");
    process.exit(2);
  }

  const sql = postgres(databaseUrl);

  try {
    // Test connection
    await sql`SELECT 1`;

    const tables = extractTables();
    console.log(`Found ${String(tables.size)} tables in schema\n`);

    const results: ValidationResult[] = [];
    let hasErrors = false;

    for (const [tableName, table] of tables) {
      if (targetTable && tableName !== targetTable) {
        continue;
      }

      const result = await validateTable(sql, tableName, table);
      results.push(result);

      if (result.missingInDb.length > 0) {
        hasErrors = true;
        console.log(`❌ ${tableName}`);
        console.log(`   Missing in DB: ${result.missingInDb.join(", ")}`);
      } else if (verbose) {
        console.log(`✅ ${tableName} (${String(result.schemaColumns.length)} columns)`);
      }

      if (result.extraInDb.length > 0 && verbose) {
        console.log(`   Extra in DB (not in schema): ${result.extraInDb.join(", ")}`);
      }
    }

    console.log("");

    if (hasErrors) {
      const totalMissing = results.reduce((sum, r) => sum + r.missingInDb.length, 0);
      console.log(`\n⚠️  SCHEMA VALIDATION FAILED`);
      console.log(`   ${String(totalMissing)} column(s) missing in database`);
      console.log(`   Run 'pnpm schema:fix' to generate ALTER TABLE statements`);
      console.log(`   Or run 'pnpm db:push:force' to apply schema changes`);
      process.exit(1);
    } else {
      console.log(`✅ Schema validation passed`);
      if (targetTable) {
        console.log(`   Table '${targetTable}' matches database`);
      } else {
        console.log(`   All ${String(tables.size)} tables match database`);
      }
      process.exit(0);
    }
  } catch (error) {
    console.error("ERROR:", error instanceof Error ? error.message : error);
    process.exit(2);
  } finally {
    await sql.end();
  }
}

void main();
