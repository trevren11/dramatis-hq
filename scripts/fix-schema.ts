#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-floating-promises, complexity */
/**
 * Schema Fix Script
 *
 * Detects missing columns and generates ALTER TABLE statements to add them.
 * Can run in dry-run mode (default) or apply changes directly.
 *
 * Usage:
 *   pnpm schema:fix           # Dry run - show SQL only
 *   pnpm schema:fix --apply   # Apply the changes
 *   tsx scripts/fix-schema.ts --apply
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { getTableConfig } from "drizzle-orm/pg-core";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";

const connectionString = process.env.DATABASE_URL ?? "postgres://build:build@localhost:5433/build";

interface MissingColumn {
  table: string;
  column: string;
  sqlType: string;
  isNotNull: boolean;
  hasDefault: boolean;
  defaultValue: string | null;
}

interface FixResult {
  missingColumns: MissingColumn[];
  statements: string[];
  applied: boolean;
  errors: string[];
}

/**
 * Extract all table definitions from the schema module
 */
function getSchemaDefinitions(): Map<string, Map<string, PgColumn>> {
  const tables = new Map<string, Map<string, PgColumn>>();

  for (const [, value] of Object.entries(schema)) {
    if (isPgTable(value)) {
      const tableConfig = getTableConfig(value);
      const tableName = tableConfig.name;
      const columns = new Map<string, PgColumn>();

      for (const column of tableConfig.columns) {
        columns.set(column.name, column);
      }

      tables.set(tableName, columns);
    }
  }

  return tables;
}

/**
 * Check if a value is a PgTable
 */
function isPgTable(value: unknown): value is PgTable {
  return (
    value !== null &&
    typeof value === "object" &&
    "_" in value &&
    typeof (value as Record<string, unknown>)._ === "object"
  );
}

/**
 * Query the database for actual column information
 */
async function getDatabaseColumns(
  db: ReturnType<typeof drizzle>,
  tableNames: string[]
): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>();

  if (tableNames.length === 0) {
    return result;
  }

  const rows = await db.execute<{
    table_name: string;
    column_name: string;
  }>(sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${tableNames})
  `);

  for (const row of rows) {
    const tableName = row.table_name;
    if (!result.has(tableName)) {
      result.set(tableName, new Set());
    }
    result.get(tableName)!.add(row.column_name);
  }

  return result;
}

/**
 * Infer a safe default value based on the SQL type.
 * We can't reliably access Drizzle's internal default config,
 * so we infer sensible defaults based on the column type.
 *
 * For ALTER TABLE on existing rows, we need defaults that won't fail.
 */
function inferDefaultValue(
  sqlType: string,
  columnName: string
): { hasDefault: boolean; defaultValue: string | null } {
  const lowerType = sqlType.toLowerCase();

  // Timestamp columns - use NOW() for created_at/updated_at
  if (lowerType.includes("timestamp")) {
    if (columnName.includes("created") || columnName.includes("updated")) {
      return { hasDefault: true, defaultValue: "NOW()" };
    }
    return { hasDefault: true, defaultValue: "NULL" };
  }

  // UUID primary keys - use gen_random_uuid()
  if (lowerType === "uuid") {
    return { hasDefault: true, defaultValue: "gen_random_uuid()" };
  }

  // JSONB - default to empty object or array based on common patterns
  if (lowerType === "jsonb") {
    // Common array columns
    if (
      columnName.includes("memberships") ||
      columnName.includes("skills") ||
      columnName.includes("selected") ||
      columnName.includes("order")
    ) {
      return { hasDefault: true, defaultValue: "'[]'::jsonb" };
    }
    // Default to empty object for other jsonb
    return { hasDefault: true, defaultValue: "'{}'::jsonb" };
  }

  // Boolean - default to false
  if (lowerType === "boolean") {
    return { hasDefault: true, defaultValue: "false" };
  }

  // Integer - default to NULL (safer than 0)
  if (lowerType === "integer" || lowerType === "bigint" || lowerType === "smallint") {
    return { hasDefault: true, defaultValue: "NULL" };
  }

  // Text/varchar - default to NULL
  if (lowerType.includes("varchar") || lowerType === "text") {
    return { hasDefault: true, defaultValue: "NULL" };
  }

  // Enum types - need to return NULL (can't know valid values)
  // For safety, return NULL default
  return { hasDefault: true, defaultValue: "NULL" };
}

/**
 * Generate ALTER TABLE statement for a missing column
 */
function generateAlterStatement(col: MissingColumn): string {
  let stmt = `ALTER TABLE "${col.table}" ADD COLUMN "${col.column}" ${col.sqlType}`;

  if (col.hasDefault && col.defaultValue) {
    stmt += ` DEFAULT ${col.defaultValue}`;
  }

  if (col.isNotNull && !col.hasDefault) {
    // Can't add NOT NULL without a default on existing rows
    // First add with default NULL, then update, then set NOT NULL
    console.warn(
      `  Warning: ${col.table}.${col.column} is NOT NULL but has no default. Adding as nullable.`
    );
  } else if (col.isNotNull) {
    stmt += ` NOT NULL`;
  }

  return stmt + ";";
}

/**
 * Find missing columns and generate fix statements
 */
async function analyzeSchema(): Promise<FixResult> {
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  try {
    const schemaDefinitions = getSchemaDefinitions();
    const tableNames = Array.from(schemaDefinitions.keys());
    const databaseColumns = await getDatabaseColumns(db, tableNames);

    const missingColumns: MissingColumn[] = [];

    // Check for missing columns
    for (const [tableName, expectedColumns] of schemaDefinitions) {
      const actualColumns = databaseColumns.get(tableName) ?? new Set();

      for (const [columnName, column] of expectedColumns) {
        if (!actualColumns.has(columnName)) {
          const sqlType = column.getSQLType();
          const { hasDefault, defaultValue } = inferDefaultValue(sqlType, columnName);
          missingColumns.push({
            table: tableName,
            column: columnName,
            sqlType,
            isNotNull: column.notNull,
            hasDefault,
            defaultValue,
          });
        }
      }
    }

    // Generate ALTER statements
    const statements = missingColumns.map(generateAlterStatement);

    return {
      missingColumns,
      statements,
      applied: false,
      errors: [],
    };
  } finally {
    await client.end();
  }
}

/**
 * Apply ALTER TABLE statements to the database
 */
async function applyFixes(statements: string[]): Promise<string[]> {
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);
  const errors: string[] = [];

  try {
    for (const stmt of statements) {
      try {
        console.log(`  Executing: ${stmt}`);
        await db.execute(sql.raw(stmt));
        console.log(`  OK`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`  FAILED: ${errorMsg}`);
        errors.push(`${stmt} -- Error: ${errorMsg}`);
      }
    }
  } finally {
    await client.end();
  }

  return errors;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const applyChanges = process.argv.includes("--apply");

  console.log("=== Schema Fix ===\n");
  console.log(`Mode: ${applyChanges ? "APPLY" : "DRY RUN"}`);
  console.log("");

  try {
    const result = await analyzeSchema();

    if (result.missingColumns.length === 0) {
      console.log("No missing columns found. Schema is up to date.");
      process.exit(0);
    }

    console.log(`Found ${result.missingColumns.length} missing column(s):\n`);
    for (const col of result.missingColumns) {
      console.log(`  - ${col.table}.${col.column} (${col.sqlType})`);
    }
    console.log("");

    console.log("Generated ALTER TABLE statements:\n");
    for (const stmt of result.statements) {
      console.log(`  ${stmt}`);
    }
    console.log("");

    if (applyChanges) {
      console.log("Applying changes...\n");
      const errors = await applyFixes(result.statements);

      if (errors.length > 0) {
        console.log(`\nCompleted with ${errors.length} error(s).`);
        process.exit(1);
      } else {
        console.log("\nAll changes applied successfully.");
        process.exit(0);
      }
    } else {
      console.log("Dry run complete. Run with --apply to apply changes.");
      console.log("  pnpm schema:fix --apply");
      process.exit(1); // Exit 1 to indicate fixes are needed
    }
  } catch (error) {
    console.error("Schema fix error:", error);
    process.exit(1);
  }
}

main();
