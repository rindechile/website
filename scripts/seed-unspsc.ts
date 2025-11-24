#!/usr/bin/env node
/**
 * Seeds UNSPSC (United Nations Standard Products and Services Code) tables
 * Reads from clean_unspsc_data.csv and populates segments, families, classes, and commodities tables
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface UnspscRow {
  segmentCode: string;
  segmentName: string;
  familyCode: string;
  familyName: string;
  classCode: string;
  className: string;
  commodityCode: string;
  commodityName: string;
}

interface UnspscData {
  segments: Map<string, string>;
  families: Map<string, { segmentId: string; name: string }>;
  classes: Map<string, { familyId: string; name: string }>;
  commodities: Map<string, { classId: string; name: string }>;
}

function parseCsv(filePath: string): UnspscRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Skip header row
  const rows = lines.slice(1);
  
  return rows.map(line => {
    const parts = line.split(',');
    return {
      segmentCode: parts[0],
      segmentName: parts[1],
      familyCode: parts[2],
      familyName: parts[3],
      classCode: parts[4],
      className: parts[5],
      commodityCode: parts[6],
      commodityName: parts[7],
    };
  });
}

function extractUnspscData(rows: UnspscRow[]): UnspscData {
  const segments = new Map<string, string>();
  const families = new Map<string, { segmentId: string; name: string }>();
  const classes = new Map<string, { familyId: string; name: string }>();
  const commodities = new Map<string, { classId: string; name: string }>();

  for (const row of rows) {
    // Add segment if not exists
    if (!segments.has(row.segmentCode)) {
      segments.set(row.segmentCode, row.segmentName);
    }

    // Add family if not exists
    if (!families.has(row.familyCode)) {
      families.set(row.familyCode, {
        segmentId: row.segmentCode,
        name: row.familyName,
      });
    }

    // Add class if not exists
    if (!classes.has(row.classCode)) {
      classes.set(row.classCode, {
        familyId: row.familyCode,
        name: row.className,
      });
    }

    // Add commodity
    commodities.set(row.commodityCode, {
      classId: row.classCode,
      name: row.commodityName,
    });
  }

  return { segments, families, classes, commodities };
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSqlInserts(data: UnspscData, batchSize: number = 500): string {
  const lines: string[] = [];

  // Insert segments
  console.log(`Generating SQL for ${data.segments.size} segments...`);
  const segmentEntries = Array.from(data.segments.entries());
  for (let i = 0; i < segmentEntries.length; i += batchSize) {
    const batch = segmentEntries.slice(i, i + batchSize);
    const values = batch
      .map(([id, name]) => `('${id}', '${escapeSqlString(name)}')`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO segments (id, name) VALUES\n  ${values};`);
  }

  // Insert families
  console.log(`Generating SQL for ${data.families.size} families...`);
  const familyEntries = Array.from(data.families.entries());
  for (let i = 0; i < familyEntries.length; i += batchSize) {
    const batch = familyEntries.slice(i, i + batchSize);
    const values = batch
      .map(([id, { segmentId, name }]) => 
        `('${id}', '${segmentId}', '${escapeSqlString(name)}')`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO families (id, segment_id, name) VALUES\n  ${values};`);
  }

  // Insert classes
  console.log(`Generating SQL for ${data.classes.size} classes...`);
  const classEntries = Array.from(data.classes.entries());
  for (let i = 0; i < classEntries.length; i += batchSize) {
    const batch = classEntries.slice(i, i + batchSize);
    const values = batch
      .map(([id, { familyId, name }]) => 
        `('${id}', '${familyId}', '${escapeSqlString(name)}')`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO classes (id, family_id, name) VALUES\n  ${values};`);
  }

  // Insert commodities
  console.log(`Generating SQL for ${data.commodities.size} commodities...`);
  const commodityEntries = Array.from(data.commodities.entries());
  for (let i = 0; i < commodityEntries.length; i += batchSize) {
    const batch = commodityEntries.slice(i, i + batchSize);
    const values = batch
      .map(([id, { classId, name }]) => 
        `('${id}', '${classId}', '${escapeSqlString(name)}')`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO commodities (id, class_id, name) VALUES\n  ${values};`);
  }

  return lines.join('\n\n');
}

function main() {
  const isRemote = process.argv.includes('--remote');
  const environment = isRemote ? 'remote' : 'local';
  
  console.log(`🌱 Seeding UNSPSC data to ${environment} database...\n`);

  // Read CSV file
  const csvPath = join(__dirname, '..', 'schemas', 'data', 'clean_unspsc_data.csv');
  console.log('📖 Reading CSV file...');
  const rows = parseCsv(csvPath);
  console.log(`✅ Parsed ${rows.length} rows\n`);

  // Extract unique data
  console.log('🔍 Extracting unique UNSPSC entities...');
  const data = extractUnspscData(rows);
  console.log(`✅ Found:`);
  console.log(`   - ${data.segments.size} segments`);
  console.log(`   - ${data.families.size} families`);
  console.log(`   - ${data.classes.size} classes`);
  console.log(`   - ${data.commodities.size} commodities\n`);

  // Generate SQL
  console.log('📝 Generating SQL inserts...');
  const sql = generateSqlInserts(data);
  
  // Write SQL file
  const sqlPath = join(__dirname, 'seed-unspsc.sql');
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
    
    console.log(`\n✅ Successfully seeded UNSPSC data to ${environment} database!`);
  } catch (error) {
    console.error(`\n❌ Error executing SQL:`, error);
    process.exit(1);
  }
}

main();
