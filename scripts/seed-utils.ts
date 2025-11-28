#!/usr/bin/env node
/**
 * Shared utilities for database seeding scripts
 * Provides common functionality for reading CSV files, generating SQL, and executing via Wrangler
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Configuration for a seeding operation
 */
export interface SeedConfig {
  /** Name of the entity being seeded (e.g., "regions", "municipalities") */
  entityName: string;
  /** Path to the CSV file relative to the project root */
  csvPath: string;
  /** Path where the SQL file should be written relative to scripts folder */
  sqlOutputPath: string;
  /** Whether to target remote database (default: false for local) */
  isRemote?: boolean;
}

/**
 * Options for SQL generation
 */
export interface SqlGenerationOptions {
  /** Size of batches for INSERT statements (default: 500) */
  batchSize?: number;
}

/**
 * Parse a CSV line respecting quoted fields
 * @param line CSV line to parse
 * @returns Array of field values
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (two consecutive quotes)
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field delimiter outside quotes
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add the last field
  fields.push(currentField);

  return fields;
}

/**
 * Parse a CSV file and return rows as objects
 * @param filePath Absolute path to the CSV file
 * @param skipHeader Whether to skip the first row (default: true)
 * @returns Array of row data as string arrays
 */
export function parseCsv(filePath: string, skipHeader: boolean = true): string[][] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const rows = skipHeader ? lines.slice(1) : lines;

  return rows.map(line => parseCsvLine(line));
}

/**
 * Escape single quotes in SQL strings
 * @param str String to escape
 * @returns Escaped string safe for SQL
 */
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Generate batched SQL INSERT statements
 * @param tableName Name of the table to insert into
 * @param columns Array of column names
 * @param data Array of data entries (as Maps or objects)
 * @param valueMapper Function to map each entry to a SQL values string
 * @param options Options for SQL generation
 * @returns SQL INSERT statements
 */
export function generateBatchedInserts<T>(
  tableName: string,
  columns: string[],
  data: T[],
  valueMapper: (entry: T) => string,
  options: SqlGenerationOptions = {}
): string {
  const batchSize = options.batchSize ?? 500;
  const lines: string[] = [];

  console.log(`Generating SQL for ${data.length} ${tableName} records...`);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const values = batch.map(valueMapper).join(',\n  ');
    const columnList = columns.join(', ');
    lines.push(`INSERT OR IGNORE INTO ${tableName} (${columnList}) VALUES\n  ${values};`);
  }

  return lines.join('\n\n');
}

/**
 * Write SQL to a file
 * @param sqlPath Absolute path to write the SQL file
 * @param sql SQL content
 */
export function writeSqlFile(sqlPath: string, sql: string): void {
  writeFileSync(sqlPath, sql, 'utf-8');
  console.log(`✅ SQL file written to ${sqlPath}\n`);
}

/**
 * Execute SQL file via Wrangler D1
 * @param sqlPath Absolute path to the SQL file
 * @param isRemote Whether to execute against remote database
 * @param projectRoot Path to the project root (where wrangler.toml is)
 */
export function executeViaWrangler(
  sqlPath: string,
  isRemote: boolean = false,
  projectRoot?: string
): void {
  const environment = isRemote ? 'remote' : 'local';
  console.log(`🚀 Executing SQL via Wrangler (${environment})...`);

  try {
    const flag = isRemote ? '--remote' : '--local';
    const command = `wrangler d1 execute DB ${flag} --file=${sqlPath}`;
    console.log(`Running: ${command}\n`);

    execSync(command, {
      stdio: 'inherit',
      cwd: projectRoot || join(__dirname, '..')
    });

    console.log(`\n✅ Successfully executed SQL in ${environment} database!`);
  } catch (error) {
    console.error(`\n❌ Error executing SQL:`, error);
    throw error;
  }
}

/**
 * Standard main function for seed scripts
 * @param config Seed configuration
 * @param processData Function that processes CSV data and returns SQL
 */
export async function runSeedScript(
  config: SeedConfig,
  processData: (csvPath: string) => string
): Promise<void> {
  const isRemote = config.isRemote ?? false;
  const environment = isRemote ? 'remote' : 'local';

  console.log(`🌱 Seeding ${config.entityName} data to ${environment} database...\n`);

  try {
    // Generate SQL
    console.log('📝 Processing data and generating SQL...');
    const sql = processData(config.csvPath);

    // Write SQL file
    const sqlPath = join(__dirname, config.sqlOutputPath);
    writeSqlFile(sqlPath, sql);

    // Execute via Wrangler
    executeViaWrangler(sqlPath, isRemote);

    console.log(`✅ Successfully seeded ${config.entityName} data to ${environment} database!`);
  } catch (error) {
    console.error(`❌ Error seeding ${config.entityName}:`, error);
    throw error;
  }
}

/**
 * Check for --remote flag in command line arguments
 */
export function isRemoteMode(): boolean {
  return process.argv.includes('--remote');
}

/**
 * Log the start of data extraction
 */
export function logExtractionStart(entityName: string): void {
  console.log(`🔍 Extracting unique ${entityName}...`);
}

/**
 * Log extraction results
 */
export function logExtractionResults(results: Record<string, number>): void {
  console.log('✅ Found:');
  for (const [entity, count] of Object.entries(results)) {
    console.log(`   - ${count} ${entity}`);
  }
  console.log('');
}

/**
 * Log CSV parsing
 */
export function logCsvParsing(filePath: string, rowCount: number): void {
  console.log('📖 Reading CSV file...');
  console.log(`✅ Parsed ${rowCount} rows\n`);
}
