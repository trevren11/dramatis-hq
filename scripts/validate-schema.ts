#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-floating-promises */
/**
 * Schema Validation Script
 *
 * Compares the actual database schema against Drizzle schema definitions.
 * Exits with code 1 if any columns are missing.
 *
 * Usage:
 *   pnpm schema:validate
 *   tsx scripts/validate-schema.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { getTableConfig } from "drizzle-orm/pg-core";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";

const connectionString = process.env.DATABASE_URL ?? "postgres://build:build@localhost:5433/build";

interface ColumnInfo {
  table: string;
  column: string;
  dataType: string;
  isNullable: boolean;
}

interface MissingColumn {
  table: string;
  column: string;
  expectedType: string;
}

interface ExtraColumn {
  table: string;
  column: string;
  actualType: string;
}

interface ValidationResult {
  isValid: boolean;
  missingColumns: MissingColumn[];
  extraColumns: ExtraColumn[];
  tablesChecked: number;
  columnsChecked: number;
}

/**
 * Extract all table definitions from the schema module
 */
function getSchemaDefinitions(): Map<string, Map<string, string>> {
  const tables = new Map<string, Map<string, string>>();

  for (const [, value] of Object.entries(schema)) {
    if (isPgTable(value)) {
      const tableConfig = getTableConfig(value);
      const tableName = tableConfig.name;
      const columns = new Map<string, string>();

      for (const column of tableConfig.columns) {
        columns.set(column.name, getColumnType(column));
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
 * Get a human-readable type from a Drizzle column definition
 */
function getColumnType(column: PgColumn): string {
  const sqlName = column.getSQLType();
  return sqlName;
}

/**
 * Query the database for actual column information
 */
async function getDatabaseColumns(
  db: ReturnType<typeof drizzle>,
  tableNames: string[]
): Promise<Map<string, Map<string, ColumnInfo>>> {
  const result = new Map<string, Map<string, ColumnInfo>>();

  if (tableNames.length === 0) {
    return result;
  }

  const rows = await db.execute<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
  }>(sql`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${tableNames})
    ORDER BY table_name, ordinal_position
  `);

  for (const row of rows) {
    const tableName = row.table_name;
    const columnInfo: ColumnInfo = {
      table: tableName,
      column: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === "YES",
    };

    if (!result.has(tableName)) {
      result.set(tableName, new Map());
    }
    result.get(tableName)!.set(row.column_name, columnInfo);
  }

  return result;
}

/**
 * Validate schema by comparing Drizzle definitions against database
 */
async function validateSchema(): Promise<ValidationResult> {
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  try {
    const schemaDefinitions = getSchemaDefinitions();
    const tableNames = Array.from(schemaDefinitions.keys());
    const databaseColumns = await getDatabaseColumns(db, tableNames);

    const missingColumns: MissingColumn[] = [];
    const extraColumns: ExtraColumn[] = [];
    let columnsChecked = 0;

    // Check for missing columns (in schema but not in DB)
    for (const [tableName, expectedColumns] of schemaDefinitions) {
      const actualColumns = databaseColumns.get(tableName);

      if (!actualColumns) {
        // Entire table is missing
        for (const [columnName, columnType] of expectedColumns) {
          missingColumns.push({
            table: tableName,
            column: columnName,
            expectedType: columnType,
          });
        }
        continue;
      }

      for (const [columnName, columnType] of expectedColumns) {
        columnsChecked++;
        if (!actualColumns.has(columnName)) {
          missingColumns.push({
            table: tableName,
            column: columnName,
            expectedType: columnType,
          });
        }
      }

      // Check for extra columns (in DB but not in schema) - informational only
      for (const [columnName, columnInfo] of actualColumns) {
        if (!expectedColumns.has(columnName)) {
          extraColumns.push({
            table: tableName,
            column: columnName,
            actualType: columnInfo.dataType,
          });
        }
      }
    }

    return {
      isValid: missingColumns.length === 0,
      missingColumns,
      extraColumns,
      tablesChecked: tableNames.length,
      columnsChecked,
    };
  } finally {
    await client.end();
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log("=== Schema Validation ===\n");

  try {
    const result = await validateSchema();

    console.log(`Tables checked: ${result.tablesChecked}`);
    console.log(`Columns checked: ${result.columnsChecked}`);
    console.log("");

    if (result.missingColumns.length > 0) {
      console.log("MISSING COLUMNS (in Drizzle schema but not in database):");
      for (const col of result.missingColumns) {
        console.log(`  - ${col.table}.${col.column} (${col.expectedType})`);
      }
      console.log("");
    }

    if (result.extraColumns.length > 0) {
      console.log("EXTRA COLUMNS (in database but not in Drizzle schema):");
      for (const col of result.extraColumns) {
        console.log(`  - ${col.table}.${col.column} (${col.actualType})`);
      }
      console.log("");
    }

    if (result.isValid) {
      console.log("Schema validation: PASSED");
      process.exit(0);
    } else {
      console.log("Schema validation: FAILED");
      console.log(`\n${result.missingColumns.length} missing column(s) found.`);
      console.log("\nRun 'pnpm schema:fix' to generate ALTER TABLE statements.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Schema validation error:", error);
    process.exit(1);
  }
}

main();
