#!/usr/bin/env node
/**
 * Local database reset script for development
 * This script connects to the local D1 database and performs reset operations
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { resetDatabase } from "./reset-db";

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Default values
  let mode: "delete" | "drop" = "delete";
  let isDryRun = false;

  // Check for help flag
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Local Database Reset Script
---------------------------
Usage: node scripts/reset-db-local.ts [options]

Options:
  --delete       Delete all data from tables without dropping them (default)
  --drop         Drop all tables and indexes including drizzle migrations
  --dry, --dry-run  Perform a dry run (show what would happen without making changes)
  --help, -h     Show this help text

Examples:
  node scripts/reset-db-local.ts --delete          # Delete all data
  node scripts/reset-db-local.ts --drop            # Drop all tables
  node scripts/reset-db-local.ts --delete --dry    # Dry run for delete mode
  node scripts/reset-db-local.ts --drop --dry-run  # Dry run for drop mode

Note: This connects to your local .wrangler/state/v3/d1 database.
Make sure you have run 'wrangler dev' at least once to initialize it.
`);
    process.exit(0);
  }

  // Check for mode argument
  if (args.includes("--drop")) {
    mode = "drop";
  } else if (args.includes("--delete")) {
    mode = "delete";
  }

  // Check for dry run flag
  if (args.includes("--dry") || args.includes("--dry-run")) {
    isDryRun = true;
  }

  try {
    // Connect to local D1 database
    // Note: Adjust the path based on your actual wrangler configuration
    const dbPath = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
    
    console.log(`Connecting to local database at: ${dbPath}`);
    
    const client = createClient({
      url: `file:${dbPath}`,
    });

    const db = drizzle(client);

    console.log(`Running database reset with mode: ${mode}, dry run: ${isDryRun ? "yes" : "no"}`);
    
    await resetDatabase(db, mode, { dry: isDryRun });
    
    console.log("Database reset completed successfully!");
  } catch (error) {
    console.error("Failed to reset database:", error);
    process.exit(1);
  }
}

main();
