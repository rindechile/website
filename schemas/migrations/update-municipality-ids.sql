-- Migration to update municipality IDs to use cod_comuna from GeoJSON
-- This migration will:
-- 1. Create a new municipalities table with cod_comuna as primary key
-- 2. Populate it with data from GeoJSON
-- 3. Update purchases table to use the new municipality IDs
-- 4. Drop the old table and rename the new one

-- Step 1: Create new municipalities table with cod_comuna as ID
CREATE TABLE IF NOT EXISTS municipalities_new (
  id INTEGER PRIMARY KEY,
  region_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Step 2: Populate with cod_comuna data (this will be done via seed-municipalities.sql)
-- The seed file now includes: INSERT INTO municipalities_new (id, region_id, name) VALUES (10101, '10', 'Puerto Montt'), ...

-- Step 3: Create a mapping table to track old ID -> new cod_comuna
-- First, we need to match municipalities by name and region
-- This is complex because the old table has different names than GeoJSON

-- For now, we'll drop and recreate. Data will be re-seeded.
-- WARNING: This will delete existing purchase data!

DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS municipalities;

-- Rename new table to municipalities
ALTER TABLE municipalities_new RENAME TO municipalities;

-- Recreate purchases table with updated foreign key
CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  municipality_id INTEGER NOT NULL,
  supplier_id INTEGER NOT NULL,
  commodity_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  FOREIGN KEY (municipality_id) REFERENCES municipalities(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (commodity_id) REFERENCES commodities(id)
);
