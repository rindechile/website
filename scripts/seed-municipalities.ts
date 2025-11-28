#!/usr/bin/env node
/**
 * Seeds municipalities data
 * Reads from municipalities.csv and populates municipalities table
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface MunicipalityRow {
  id: string;
  name: string;
  budget: string;
  budget_per_capita: string;
  region_id: string;
}

interface MunicipalityData {
  municipalities: Map<string, {
    id: number;
    name: string;
    budget: number;
    budget_per_capita: number;
    region_id: number;
  }>;
}

function parseCsv(filePath: string): MunicipalityRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Skip header row
  const rows = lines.slice(1);
  
  return rows.map(line => {
    const parts = line.split(',');
    return {
      id: parts[0],
      name: parts[1],
      budget: parts[2],
      budget_per_capita: parts[3],
      region_id: parts[4],
    };
  });
}

function extractMunicipalityData(rows: MunicipalityRow[]): MunicipalityData {
  const municipalities = new Map<string, {
    id: number;
    name: string;
    budget: number;
    budget_per_capita: number;
    region_id: number;
  }>();

  for (const row of rows) {
    // Skip if already exists
    if (municipalities.has(row.id)) {
      continue;
    }

    municipalities.set(row.id, {
      id: parseInt(row.id, 10),
      name: row.name,
      budget: parseFloat(row.budget),
      budget_per_capita: parseFloat(row.budget_per_capita),
      region_id: parseInt(row.region_id, 10),
    });
  }

  return { municipalities };
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSqlInserts(data: MunicipalityData, batchSize: number = 500): string {
  const lines: string[] = [];

  // Insert municipalities
  console.log(`Generating SQL for ${data.municipalities.size} municipalities...`);
  const municipalityEntries = Array.from(data.municipalities.entries());
  
  for (let i = 0; i < municipalityEntries.length; i += batchSize) {
    const batch = municipalityEntries.slice(i, i + batchSize);
    const values = batch
      .map(([, { id, name, budget, budget_per_capita, region_id }]) => 
        `(${id}, '${escapeSqlString(name)}', ${budget}, ${budget_per_capita}, ${region_id})`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO municipalities (id, name, budget, budget_per_capita, region_id) VALUES\n  ${values};`);
  }

  return lines.join('\n\n');
}

function main() {
  const isRemote = process.argv.includes('--remote');
  const environment = isRemote ? 'remote' : 'local';
  
  console.log(`🌱 Seeding municipalities data to ${environment} database...\n`);

  // Read CSV file
  const csvPath = join(__dirname, '..', 'schemas', 'data', 'municipalities.csv');
  console.log('📖 Reading CSV file...');
  const rows = parseCsv(csvPath);
  console.log(`✅ Parsed ${rows.length} rows\n`);

  // Extract unique data
  console.log('🔍 Extracting unique municipalities...');
  const data = extractMunicipalityData(rows);
  console.log(`✅ Found:`);
  console.log(`   - ${data.municipalities.size} municipalities\n`);

  // Generate SQL
  console.log('📝 Generating SQL inserts...');
  const sql = generateSqlInserts(data);
  
  // Write SQL file
  const sqlPath = join(__dirname, 'sql/seed-municipalities.sql');
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
    
    console.log(`\n✅ Successfully seeded municipalities data to ${environment} database!`);
  } catch (error) {
    console.error(`\n❌ Error executing SQL:`, error);
    process.exit(1);
  }
}

main();
