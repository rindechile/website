#!/usr/bin/env node
/**
 * Seeds items data
 * Reads from products.csv and populates items table
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface ItemRow {
  expected_min_range: string;
  expected_max_range: string;
  max_acceptable_price: string;
  commodity_id: string;
  id: string;
  name: string;
  has_sufficient_data: string;
}

interface ItemData {
  items: Map<string, {
    expected_min_range: number;
    expected_max_range: number;
    max_acceptable_price: number;
    commodity_id: string;
    id: number;
    name: string;
    has_sufficient_data: number;
  }>;
}

function parseCsv(filePath: string): ItemRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Skip header row
  const rows = lines.slice(1);
  
  return rows.map(line => {
    const parts = line.split(',');
    return {
      expected_min_range: parts[0],
      expected_max_range: parts[1],
      max_acceptable_price: parts[2],
      commodity_id: parts[3],
      id: parts[4],
      name: parts[5],
      has_sufficient_data: parts[7],
    };
  });
}

function extractItemData(rows: ItemRow[]): ItemData {
  const items = new Map<string, {
    expected_min_range: number;
    expected_max_range: number;
    max_acceptable_price: number;
    commodity_id: string;
    id: number;
    name: string;
    has_sufficient_data: number;
  }>();

  for (const row of rows) {
    // Skip if already exists
    if (items.has(row.id)) {
      continue;
    }

    const hasData = (row.has_sufficient_data || '').toString().trim().toLowerCase() === 'true' ? 1 : 0;

    items.set(row.id, {
      expected_min_range: parseInt(row.expected_min_range, 10),
      expected_max_range: parseInt(row.expected_max_range, 10),
      max_acceptable_price: parseFloat(row.max_acceptable_price),
      commodity_id: row.commodity_id,
      id: parseInt(row.id, 10),
      name: row.name,
      has_sufficient_data: hasData,
    });
  }

  return { items };
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSqlInserts(data: ItemData, batchSize: number = 500): string {
  const lines: string[] = [];

  // Insert items
  console.log(`Generating SQL for ${data.items.size} items...`);
  const itemEntries = Array.from(data.items.entries());
  
  for (let i = 0; i < itemEntries.length; i += batchSize) {
    const batch = itemEntries.slice(i, i + batchSize);
    const values = batch
      .map(([, { expected_min_range, expected_max_range, max_acceptable_price, commodity_id, id, name, has_sufficient_data }]) => 
        `(${expected_min_range}, ${expected_max_range}, ${max_acceptable_price}, '${escapeSqlString(commodity_id)}', ${id}, '${escapeSqlString(name)}', ${has_sufficient_data ? 1 : 0})`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO items (expected_min_range, expected_max_range, max_acceptable_price, commodity_id, id, name, has_sufficient_data) VALUES\n  ${values};`);
  }

  return lines.join('\n\n');
}

function main() {
  const isRemote = process.argv.includes('--remote');
  const environment = isRemote ? 'remote' : 'local';
  
  console.log(`🌱 Seeding items data to ${environment} database...\n`);

  // Read CSV file
  const csvPath = join(__dirname, '..', 'schemas', 'data', 'tipo_producto.csv');
  console.log('📖 Reading CSV file...');
  const rows = parseCsv(csvPath);
  console.log(`✅ Parsed ${rows.length} rows\n`);

  // Extract unique data
  console.log('🔍 Extracting unique items...');
  const data = extractItemData(rows);
  console.log(`✅ Found:`);
  console.log(`   - ${data.items.size} items\n`);

  // Generate SQL
  console.log('📝 Generating SQL inserts...');
  const sql = generateSqlInserts(data);
  
  // Write SQL file
  const sqlPath = join(__dirname, 'sql/seed-items.sql');
  writeFileSync(sqlPath, sql, 'utf-8');
  console.log(`✅ SQL file written to ${sqlPath}\n`);

  // Execute via Wrangler
  console.log(`🚀 Executing SQL via Wrangler (${environment})...`);
  try {
    const flag = isRemote ? '--remote' : '--local';
    // Use database binding name 'DB' from wrangler.toml
    const command = `wrangler d1 execute DB ${flag} --file=${sqlPath}`;
    console.log(`Running: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    
    console.log(`\n✅ Successfully seeded items data to ${environment} database!`);
  } catch (error) {
    console.error(`\n❌ Error executing SQL:`, error);
    process.exit(1);
  }
}

main();