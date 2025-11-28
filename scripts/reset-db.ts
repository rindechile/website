#!/usr/bin/env node
/**
 * Database Reset Script for SQLite (Cloudflare D1)
 * Adapted for drizzle-orm with SQLite
 */

import { drizzle } from "drizzle-orm/d1";
import { sql } from "drizzle-orm";
import * as schema from "../schemas/drizzle";

// Reset mode: 'delete' only deletes data, 'drop' drops all tables including drizzle migrations
type ResetMode = "delete" | "drop";

// Reset options
type ResetOptions = {
  dry?: boolean; // If true, only logs what would be done without actually making changes
};

/**
 * Resets the database based on the specified mode
 * @param db Database instance
 * @param mode 'delete' to only delete data, 'drop' to drop all tables including drizzle migrations
 * @param options Additional options including dry run mode
 */
export async function resetDatabase(
  db: ReturnType<typeof drizzle>,
  mode: ResetMode = "delete",
  options: ResetOptions = {}
): Promise<void> {
  const isDryRun = options.dry === true;
  const dryRunPrefix = isDryRun ? "[DRY RUN] Would" : "Will";

  console.warn(`${dryRunPrefix} start database reset in '${mode}' mode...`);

  try {
    if (mode === "delete") {
      await deleteAllData(db, isDryRun);
      console.log(`${isDryRun ? "[DRY RUN] Would have deleted" : "Successfully deleted"} all data from tables`);
    } else if (mode === "drop") {
      await dropAllTables(db, isDryRun);
      console.log(`${isDryRun ? "[DRY RUN] Would have dropped" : "Successfully dropped"} all tables including drizzle migrations`);
    } else {
      throw new Error(`Invalid reset mode: ${mode}. Must be 'delete' or 'drop'.`);
    }

    console.log(`Database reset ${isDryRun ? "dry run" : "operation"} completed successfully`);
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

/**
 * Deletes all data from all tables without dropping the tables
 * Handles foreign key constraints by deleting in the correct order
 * @param db Database instance
 * @param isDryRun If true, only logs what would be done without actually making changes
 */
async function deleteAllData(db: ReturnType<typeof drizzle>, isDryRun = false): Promise<void> {
  // Define deletion order to handle foreign key constraints
  // Tables with no dependencies should be deleted last
  // Tables that are referenced by others should be deleted first
  const deletionOrder = [
    { table: schema.purchases, name: "purchases" },
    { table: schema.items, name: "items" },
    { table: schema.suppliers, name: "suppliers" },
    { table: schema.municipalities, name: "municipalities" },
    { table: schema.regions, name: "regions" },
    { table: schema.commodities, name: "commodities" },
    { table: schema.classes, name: "classes" },
    { table: schema.families, name: "families" },
    { table: schema.segments, name: "segments" },
    { table: schema.categories, name: "categories" },
  ];

  console.log(`Found ${deletionOrder.length} tables to clear data from`);

  for (const { table, name } of deletionOrder) {
    try {
      console.log(`${isDryRun ? "[DRY RUN] Would delete" : "Deleting"} data from table: ${name}`);

      if (!isDryRun) {
        await db.delete(table);
      }
    } catch (error) {
      console.error(`Error clearing table ${name}:`, error);
      // Continue with other tables even if one fails
    }
  }
}

/**
 * Drops all tables including the drizzle migrations table
 * For SQLite, we query sqlite_master to get all tables
 * @param db Database instance
 * @param isDryRun If true, only logs what would be done without actually making changes
 */
async function dropAllTables(db: ReturnType<typeof drizzle>, isDryRun = false): Promise<void> {
  // Get all tables from SQLite's sqlite_master table
  const tablesResult = await db.all<{ name: string }>(sql`
    SELECT name FROM sqlite_master
    WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
  `);

  const tables = tablesResult.map(row => row.name);
  console.log(`Found ${tables.length} tables to drop: ${tables.join(", ")}`);

  if (!isDryRun) {
    // Disable foreign key constraints temporarily to allow dropping tables
    await db.run(sql`PRAGMA foreign_keys = OFF`);

    try {
      // Drop all tables
      for (const tableName of tables) {
        try {
          await db.run(sql.raw(`DROP TABLE IF EXISTS "${tableName}"`));
          console.log(`Dropped table: ${tableName}`);
        } catch (error) {
          console.error(`Error dropping table ${tableName}:`, error);
        }
      }
    } finally {
      // Re-enable foreign key constraints
      await db.run(sql`PRAGMA foreign_keys = ON`);
    }

    // Also drop any remaining indexes
    const indexesResult = await db.all<{ name: string }>(sql`
      SELECT name FROM sqlite_master
      WHERE type = 'index'
      AND name NOT LIKE 'sqlite_%'
    `);

    const indexes = indexesResult.map(row => row.name);
    if (indexes.length > 0) {
      console.log(`Found ${indexes.length} indexes to drop: ${indexes.join(", ")}`);
      for (const indexName of indexes) {
        try {
          await db.run(sql.raw(`DROP INDEX IF EXISTS "${indexName}"`));
          console.log(`Dropped index: ${indexName}`);
        } catch (error) {
          console.error(`Error dropping index ${indexName}:`, error);
        }
      }
    }
  } else {
    // Just log what would be dropped in dry run mode
    for (const tableName of tables) {
      console.log(`[DRY RUN] Would drop table: ${tableName}`);
    }

    // Check for indexes in dry run
    const indexesResult = await db.all<{ name: string }>(sql`
      SELECT name FROM sqlite_master
      WHERE type = 'index'
      AND name NOT LIKE 'sqlite_%'
    `);

    const indexes = indexesResult.map(row => row.name);
    if (indexes.length > 0) {
      console.log(`[DRY RUN] Found ${indexes.length} indexes that would be dropped: ${indexes.join(", ")}`);
      for (const indexName of indexes) {
        console.log(`[DRY RUN] Would drop index: ${indexName}`);
      }
    }
  }
}

/**
 * Show help text for command-line usage
 */
function showHelp(): void {
  console.log(`
Database Reset Script for SQLite (Cloudflare D1)
------------------------------------------------
Usage: wrangler d1 execute DB --local --file=<(node --loader ts-node/esm scripts/reset-db.ts [options])

Options:
  --delete       Delete all data from tables without dropping them (default)
  --drop         Drop all tables and indexes including drizzle migrations
  --dry, --dry-run  Perform a dry run (show what would happen without making changes)
  --help, -h     Show this help text

Examples:
  # For local development with wrangler:
  wrangler d1 execute DB --local --command="$(node scripts/reset-db.ts --delete)"
  wrangler d1 execute DB --local --command="$(node scripts/reset-db.ts --drop)"
  
  # Dry run:
  node scripts/reset-db.ts --delete --dry
  node scripts/reset-db.ts --drop --dry-run

Note: This script is designed for Cloudflare D1 (SQLite).
For local development, you can use wrangler to execute the commands.
For production, adapt the connection method accordingly.
`);
}

/**
 * Parse command line arguments when running the script directly
 */
function parseCommandLineArgs(): { mode: ResetMode; options: ResetOptions } | null {
  // Default values
  let mode: ResetMode = "delete";
  const options: ResetOptions = { dry: false };

  // Process command line arguments
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return null;
  }

  // Check for mode argument
  if (args.includes("--drop")) {
    mode = "drop";
  } else if (args.includes("--delete")) {
    mode = "delete";
  }

  // Check for dry run flag
  if (args.includes("--dry") || args.includes("--dry-run")) {
    options.dry = true;
  }

  return { mode, options };
}

// Export the main function for use in other scripts
export { deleteAllData, dropAllTables };

// When running this file directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = parseCommandLineArgs();

  // Only proceed if we have valid arguments (not showing help)
  if (result) {
    console.error("This script requires a database connection.");
    console.error("Please use one of the following methods:");
    console.error("");
    console.error("1. Import and call resetDatabase() with your db instance:");
    console.error("   import { resetDatabase } from './scripts/reset-db';");
    console.error("   await resetDatabase(db, 'delete', { dry: false });");
    console.error("");
    console.error("2. Use wrangler for local D1:");
    console.error("   wrangler d1 execute DB --local --file=drop-all.sql");
    console.error("");
    showHelp();
    process.exit(1);
  }
}
