#!/usr/bin/env tsx
/**
 * Schema Fix Script
 *
 * Auto-generates ALTER TABLE statements for columns missing in the database
 * compared to the Drizzle schema. Can optionally apply fixes directly.
 *
 * Usage:
 *   pnpm schema:fix                  # Generate SQL to stdout
 *   pnpm schema:fix --apply          # Apply fixes directly to database
 *   pnpm schema:fix --output fix.sql # Write SQL to file
 *
 * Exit codes:
 *   0 - No fixes needed or fixes applied successfully
 *   1 - Fixes needed (when not --apply)
 *   2 - Connection or runtime error
 */

import postgres from "postgres";
import * as schema from "../lib/db/schema/index";
import { getTableName, getTableColumns } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import * as fs from "fs";

interface ColumnDef {
  name: string;
  sqlType: string;
  nullable: boolean;
  defaultValue: string | null;
}

// Map Drizzle column type patterns to SQL types
const COLUMN_TYPE_MAP: Record<string, string> = {
  PgUUID: "UUID",
  PgVarchar: "VARCHAR(255)",
  PgText: "TEXT",
  PgInteger: "INTEGER",
  PgBoolean: "BOOLEAN",
  PgTimestamp: "TIMESTAMP",
  PgDate: "DATE",
  PgJsonb: "JSONB",
  PgJson: "JSON",
  Enum: "TEXT",
};

const DATA_TYPE_MAP: Record<string, string> = {
  string: "TEXT",
  number: "INTEGER",
  boolean: "BOOLEAN",
  date: "DATE",
  json: "JSONB",
  bigint: "BIGINT",
};

function mapDrizzleTypeToSql(columnType: string, dataType: string): string {
  // Check column type patterns
  for (const [pattern, sqlType] of Object.entries(COLUMN_TYPE_MAP)) {
    if (columnType.includes(pattern)) {
      return sqlType;
    }
  }
  // Fallback to data type
  return DATA_TYPE_MAP[dataType] ?? dataType.toUpperCase();
}

// Type for accessing internal column properties
interface ColumnInternal {
  columnType: string;
  dataType: string;
  notNull: boolean;
  hasDefault: boolean;
  default?: unknown;
  getSQLType?: () => string;
}

function getDefaultValue(
  defaultFn: unknown,
  columnType: string,
  hasDefault: boolean
): string | null {
  // Handle timestamp defaults
  if (columnType.includes("Timestamp") && hasDefault) {
    return "NOW()";
  }
  // Handle UUID defaults
  if (columnType.includes("UUID") && hasDefault) {
    return "gen_random_uuid()";
  }
  // Handle explicit defaults
  if (!hasDefault || defaultFn === undefined) {
    return null;
  }
  if (typeof defaultFn === "boolean") {
    return defaultFn ? "TRUE" : "FALSE";
  }
  if (typeof defaultFn === "number") {
    return String(defaultFn);
  }
  if (typeof defaultFn === "string") {
    return `'${defaultFn}'`;
  }
  if (defaultFn === null) {
    return "NULL";
  }
  return null;
}

function getColumnDefinition(column: PgColumn): ColumnDef {
  const name = column.name;
  const internal = column as unknown as ColumnInternal;
  const columnType = internal.columnType;
  const dataType = internal.dataType;

  const sqlType = internal.getSQLType
    ? internal.getSQLType()
    : mapDrizzleTypeToSql(columnType, dataType);

  const defaultValue = getDefaultValue(internal.default, columnType, internal.hasDefault);

  return {
    name,
    sqlType,
    nullable: !internal.notNull,
    defaultValue,
  };
}

function generateAlterTable(tableName: string, column: ColumnDef): string {
  let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.sqlType}`;

  if (!column.nullable) {
    // For NOT NULL columns without a default, we need to add a default first
    // then remove it, or handle existing rows
    if (column.defaultValue) {
      sql += ` DEFAULT ${column.defaultValue} NOT NULL`;
    } else {
      // Add as nullable first, then a note about needing to handle existing data
      sql += ` -- WARNING: Column is NOT NULL in schema but no default. Adding as nullable.`;
    }
  } else if (column.defaultValue) {
    sql += ` DEFAULT ${column.defaultValue}`;
  }

  return sql + ";";
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

async function getDbColumnNames(sql: postgres.Sql, tableName: string): Promise<Set<string>> {
  const rows = await sql<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
  `;
  return new Set(rows.map((r) => r.column_name));
}

async function applyStatements(sqlClient: postgres.Sql, statements: string[]): Promise<void> {
  console.log("\n🔧 Applying fixes...");
  for (const stmt of statements) {
    if (stmt.includes("WARNING:")) {
      console.log(`⚠️  Skipping (needs manual fix): ${stmt}`);
      continue;
    }
    try {
      await sqlClient.unsafe(stmt);
      console.log(`✅ ${stmt}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed: ${stmt}`, msg);
    }
  }
  console.log("\n✅ Schema fixes applied");
}

async function collectMissingColumns(
  sqlClient: postgres.Sql,
  tables: Map<string, PgTable>
): Promise<string[]> {
  const alterStatements: string[] = [];

  for (const [tableName, table] of tables) {
    const dbColumns = await getDbColumnNames(sqlClient, tableName);
    const schemaColumns = getTableColumns(table);

    for (const column of Object.values(schemaColumns)) {
      const colName = column.name;
      if (!dbColumns.has(colName)) {
        const colDef = getColumnDefinition(column);
        const alterSql = generateAlterTable(tableName, colDef);
        alterStatements.push(alterSql);
        console.log(`Missing: ${tableName}.${colName}`);
      }
    }
  }

  return alterStatements;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const outputIndex = args.indexOf("--output");
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable not set");
    process.exit(2);
  }

  const sqlClient = postgres(databaseUrl);

  try {
    await sqlClient`SELECT 1`;

    const tables = extractTables();
    console.log(`Analyzing ${String(tables.size)} tables...\n`);

    const alterStatements = await collectMissingColumns(sqlClient, tables);

    if (alterStatements.length === 0) {
      console.log("\n✅ No schema fixes needed - database matches schema");
      process.exit(0);
    }

    const fullSql = [
      "-- Auto-generated schema fix",
      `-- Generated at: ${new Date().toISOString()}`,
      `-- ${String(alterStatements.length)} missing column(s)`,
      "",
      ...alterStatements,
      "",
    ].join("\n");

    if (outputFile) {
      fs.writeFileSync(outputFile, fullSql);
      console.log(`\n📄 SQL written to: ${outputFile}`);
    } else if (!apply) {
      console.log("\n--- Generated SQL ---");
      console.log(fullSql);
      console.log("--- End SQL ---");
      console.log("\nRun with --apply to execute, or --output <file> to save");
    }

    if (apply) {
      await applyStatements(sqlClient, alterStatements);
      process.exit(0);
    }

    // Fixes needed but not applied
    process.exit(1);
  } catch (error) {
    console.error("ERROR:", error instanceof Error ? error.message : error);
    process.exit(2);
  } finally {
    await sqlClient.end();
  }
}

void main();
