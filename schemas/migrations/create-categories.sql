-- Migration: Add categories table and update segments schema
-- This migration should be run on a fresh database or after dropping existing data

-- Create categories table
CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);

-- Note: If segments table already exists with data, you'll need to:
-- 1. Backup existing data
-- 2. Drop the segments table
-- 3. Recreate it with the new schema
-- 4. Re-seed all data using the seed-unspsc.ts script

-- For a fresh database, the segments table will be created by seed-unspsc.ts
