# Database Reset Scripts

This directory contains scripts for resetting your Cloudflare D1 (SQLite) database.

## Available Methods

### Method 1: SQL File (Recommended for Simple Drops)

The easiest way to drop all tables is using the SQL file with wrangler:

```bash
# Local database
pnpm run db:drop:all

# Remote database (production)
pnpm run db:drop:all:remote
```

Or manually:

```bash
# Local
wrangler d1 execute transparenta --local --file=scripts/drop-all-tables.sql

# Remote
wrangler d1 execute transparenta --remote --file=scripts/drop-all-tables.sql
```

### Method 2: TypeScript Reset Script (Advanced)

For more control and programmatic usage, you can use the TypeScript reset functions.

**Import and use in your own scripts:**

```typescript
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resetDatabase } from "./scripts/reset-db";

// In an API route or server-side script
const { env } = getCloudflareContext();
const db = drizzle(env.DB);

// Delete all data (keeps table structure)
await resetDatabase(db, "delete");

// Drop all tables including migrations
await resetDatabase(db, "drop");

// Dry run (see what would happen without making changes)
await resetDatabase(db, "delete", { dry: true });
```

## Reset Modes

### `delete` Mode (Default)

Deletes all data from tables while preserving the table structure and migrations.

- ✅ Keeps table schema intact
- ✅ Preserves migrations history
- ✅ Fast re-seeding
- ⚠️ Data is deleted in the correct order to handle foreign key constraints

**Order of deletion:**
1. purchases
2. items
3. suppliers
4. municipalities
5. regions
6. commodities
7. classes
8. families
9. segments
10. categories

### `drop` Mode

Completely drops all tables including the drizzle migrations table.

- ❌ Removes all tables
- ❌ Removes migrations history
- ✅ Clean slate for database
- ⚠️ Requires running migrations again

## Common Workflows

### Reset and Re-seed Local Database

```bash
# 1. Drop all tables
pnpm run db:drop:all

# 2. Run migrations
pnpm run drizzle:migrate

# 3. Seed the database
pnpm run db:seed:all
```

Or use the combined command:

```bash
# Drop tables and run migrations
pnpm run db:reset

# Then seed
pnpm run db:seed:all
```

### Reset Remote (Production) Database

```bash
# 1. Drop all tables
pnpm run db:drop:all:remote

# 2. Run migrations (make sure drizzle.config.ts points to remote)
pnpm run drizzle:migrate

# 3. Seed the database
pnpm run db:seed:all:remote
```

Or use the combined command:

```bash
# Drop tables and run migrations
pnpm run db:reset:remote

# Then seed
pnpm run db:seed:all:remote
```

### Delete Data Only (Keep Schema)

If you just want to clear data but keep the table structure:

```typescript
import { drizzle } from "drizzle-orm/d1";
import { deleteAllData } from "./scripts/reset-db";

const db = drizzle(env.DB);
await deleteAllData(db);
```

## Files

- **`reset-db.ts`** - Main reset functions (can be imported)
- **`drop-all-tables.sql`** - SQL script to drop all tables
- **`reset-db-local.ts`** - Local development script (requires @libsql/client)

## Safety Features

- **Dry run mode**: Preview changes without executing them
- **Foreign key handling**: Deletion order respects dependencies
- **Error handling**: Continues with remaining tables if one fails
- **Logging**: Detailed output of all operations

## Notes

- Always backup production data before running drop operations
- The `drop` mode will require you to run migrations again
- Foreign key constraints are temporarily disabled during drop operations
- All user tables and drizzle migration tables are affected
