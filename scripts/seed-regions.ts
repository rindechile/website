#!/usr/bin/env node
/**
 * Seeds regions data
 * Reads from region.csv and populates regions table
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface RegionRow {
  id: string;
  name: string;
}

interface RegionData {
  regions: Map<number, {
    id: number;
    name: string;
  }>;
}

function parseCsv(filePath: string): RegionRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Skip header row
  const rows = lines.slice(1);
  
  return rows.map(line => {
    const parts = line.split(',');
    return {
      id: parts[0],
      name: parts[1],
    };
  });
}

function extractRegionData(rows: RegionRow[]): RegionData {
  const regions = new Map<number, {
    id: number;
    name: string;
  }>();

  for (const row of rows) {
    const regionId = parseInt(row.id, 10);
    
    // Skip if already exists
    if (regions.has(regionId)) {
      continue;
    }

    regions.set(regionId, {
      id: regionId,
      name: row.name,
    });
  }

  return { regions };
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSqlInserts(data: RegionData, batchSize: number = 500): string {
  const lines: string[] = [];

  // Insert regions
  console.log(`Generating SQL for ${data.regions.size} regions...`);
  const regionEntries = Array.from(data.regions.entries());
  
  for (let i = 0; i < regionEntries.length; i += batchSize) {
    const batch = regionEntries.slice(i, i + batchSize);
    const values = batch
      .map(([, { id, name }]) => 
        `(${id}, '${escapeSqlString(name)}')`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO regions (id, name) VALUES\n  ${values};`);
  }

  return lines.join('\n\n');
}

function main() {
  const isRemote = process.argv.includes('--remote');
  const environment = isRemote ? 'remote' : 'local';
  
  console.log(`🌱 Seeding regions data to ${environment} database...\n`);

  // Read CSV file
  const csvPath = join(__dirname, '..', 'schemas', 'data', 'region.csv');
  console.log('📖 Reading CSV file...');
  const rows = parseCsv(csvPath);
  console.log(`✅ Parsed ${rows.length} rows\n`);

  // Extract unique data
  console.log('🔍 Extracting unique regions...');
  const data = extractRegionData(rows);
  console.log(`✅ Found:`);
  console.log(`   - ${data.regions.size} regions\n`);

  // Generate SQL
  console.log('📝 Generating SQL inserts...');
  const sql = generateSqlInserts(data);
  
  // Write SQL file
  const sqlPath = join(__dirname, 'sql/seed-region.sql');
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
    
    console.log(`\n✅ Successfully seeded regions data to ${environment} database!`);
  } catch (error) {
    console.error(`\n❌ Error executing SQL:`, error);
    process.exit(1);
  }
}

main();