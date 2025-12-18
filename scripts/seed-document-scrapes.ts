#!/usr/bin/env node
/**
 * Seeds document_scrapes data from existing purchases
 * Creates a document_scrape entry for each unique chilecompra_code
 *
 * Uses chunked file execution to avoid D1's SQLITE_TOOBIG error
 */

import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import {
  parseCsv,
  escapeSqlString,
  isRemoteMode,
  logCsvParsing,
  logExtractionStart,
  logExtractionResults,
} from './seed-utils';

const MERCADO_PUBLICO_DETAIL_URL = 'https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx';

// Batch size for INSERT statements (rows per INSERT)
const ROWS_PER_INSERT = 25;
// Number of INSERT statements per SQL file (to stay under D1 limits)
const INSERTS_PER_FILE = 20;
// Total rows per file = 25 * 20 = 500

interface DocumentScrape {
  purchase_id: number;
  chilecompra_code: string;
  detail_url: string;
  scrape_status: string;
  scrape_attempts: number;
  created_at: string;
  updated_at: string;
}

function extractDocumentScrapeData(csvPath: string): DocumentScrape[] {
  // Parse CSV
  const rows = parseCsv(csvPath);
  logCsvParsing(csvPath, rows.length);

  // Extract unique data
  logExtractionStart('document_scrapes');
  const scrapesMap = new Map<string, DocumentScrape>();

  const now = new Date().toISOString();

  for (const parts of rows) {
    const purchaseId = parseInt(parts[0], 10);
    const chilecompraCode = parts[1];

    // Skip if already exists (same chilecompra_code)
    if (scrapesMap.has(chilecompraCode)) {
      continue;
    }

    // Skip invalid entries
    if (!chilecompraCode || chilecompraCode.trim() === '') {
      continue;
    }

    const documentScrape: DocumentScrape = {
      purchase_id: purchaseId,
      chilecompra_code: chilecompraCode,
      detail_url: `${MERCADO_PUBLICO_DETAIL_URL}?codigoOC=${encodeURIComponent(chilecompraCode)}`,
      scrape_status: 'pending',
      scrape_attempts: 0,
      created_at: now,
      updated_at: now,
    };

    scrapesMap.set(chilecompraCode, documentScrape);
  }

  const scrapes = Array.from(scrapesMap.values());

  // Debug output
  console.log('\n=== DOCUMENT SCRAPES ANALYSIS ===');
  console.log(`Total unique chilecompra codes: ${scrapes.length}`);

  console.log('\n=== SAMPLE DOCUMENT SCRAPES (first 5) ===');
  scrapes.slice(0, 5).forEach((s, i) => {
    console.log(`Sample ${i + 1}:`, {
      purchase_id: s.purchase_id,
      chilecompra_code: s.chilecompra_code,
      detail_url: s.detail_url.substring(0, 80) + '...',
    });
  });

  console.log('\n========================\n');

  logExtractionResults({ document_scrapes: scrapes.length });

  return scrapes;
}

function generateInsertStatement(scrapes: DocumentScrape[]): string {
  const columns = [
    'purchase_id',
    'chilecompra_code',
    'detail_url',
    'scrape_status',
    'scrape_attempts',
    'created_at',
    'updated_at',
  ];

  const values = scrapes
    .map(
      (s) =>
        `(${s.purchase_id}, '${escapeSqlString(s.chilecompra_code)}', '${escapeSqlString(s.detail_url)}', '${s.scrape_status}', ${s.scrape_attempts}, '${s.created_at}', '${s.updated_at}')`
    )
    .join(',\n  ');

  return `INSERT OR IGNORE INTO document_scrapes (${columns.join(', ')}) VALUES\n  ${values};`;
}

function generateChunkedSqlFiles(scrapes: DocumentScrape[], outputDir: string): string[] {
  const filePaths: string[] = [];
  const rowsPerFile = ROWS_PER_INSERT * INSERTS_PER_FILE;

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (let fileIndex = 0; fileIndex * rowsPerFile < scrapes.length; fileIndex++) {
    const fileStart = fileIndex * rowsPerFile;
    const fileEnd = Math.min(fileStart + rowsPerFile, scrapes.length);
    const fileScrapes = scrapes.slice(fileStart, fileEnd);

    const statements: string[] = [];

    // Generate INSERT statements for this file
    for (let i = 0; i < fileScrapes.length; i += ROWS_PER_INSERT) {
      const batch = fileScrapes.slice(i, i + ROWS_PER_INSERT);
      statements.push(generateInsertStatement(batch));
    }

    const sql = statements.join('\n\n');
    const filePath = join(outputDir, `seed-document-scrapes-${String(fileIndex + 1).padStart(3, '0')}.sql`);
    writeFileSync(filePath, sql, 'utf-8');
    filePaths.push(filePath);
  }

  return filePaths;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function executeViaWrangler(sqlPath: string, isRemote: boolean, maxRetries = 3): void {
  const flag = isRemote ? '--remote' : '--local';
  // Add --yes flag to skip confirmation prompts
  const command = `wrangler d1 execute DB ${flag} --yes --file=${sqlPath}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      execSync(command, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
        timeout: 120000, // 2 minute timeout
      });
      return; // Success, exit the function
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(`⚠️  Attempt ${attempt} failed, retrying in 5 seconds...`);
        // Synchronous sleep using execSync
        execSync('sleep 5');
      } else {
        throw error;
      }
    }
  }
}

function getStartFromArg(): number {
  const startFromIndex = process.argv.findIndex((arg) => arg.startsWith('--start-from='));
  if (startFromIndex !== -1) {
    const value = parseInt(process.argv[startFromIndex].split('=')[1], 10);
    return isNaN(value) ? 1 : value;
  }
  return 1;
}

function getNoCleanupArg(): boolean {
  return process.argv.includes('--no-cleanup');
}

async function main() {
  const isRemote = isRemoteMode();
  const environment = isRemote ? 'remote' : 'local';
  const startFrom = getStartFromArg();
  const noCleanup = getNoCleanupArg();

  console.log(`🌱 Seeding document_scrapes data to ${environment} database...\n`);
  if (startFrom > 1) {
    console.log(`📌 Resuming from file ${startFrom}\n`);
  }

  try {
    // Extract data
    const csvPath = join(__dirname, '..', 'schemas', 'data', 'purchase.csv');
    const scrapes = extractDocumentScrapeData(csvPath);

    if (scrapes.length === 0) {
      console.log('No data to seed.');
      return;
    }

    // Generate chunked SQL files
    const outputDir = join(__dirname, 'sql', 'document-scrapes-chunks');
    console.log(`📝 Generating chunked SQL files in ${outputDir}...`);
    const sqlFiles = generateChunkedSqlFiles(scrapes, outputDir);
    console.log(`✅ Generated ${sqlFiles.length} SQL files\n`);

    // Execute each file (starting from startFrom)
    console.log(`🚀 Executing SQL files via Wrangler (${environment})...\n`);

    const startIndex = startFrom - 1; // Convert to 0-based index
    for (let i = startIndex; i < sqlFiles.length; i++) {
      const filePath = sqlFiles[i];
      const progress = `[${i + 1}/${sqlFiles.length}]`;
      console.log(`${progress} Executing ${filePath.split('/').pop()}...`);

      try {
        executeViaWrangler(filePath, isRemote);

        // Add a 2-second delay between files for remote execution
        if (isRemote && i < sqlFiles.length - 1) {
          console.log('   ⏳ Waiting 2s before next file...');
          execSync('sleep 2');
        }
      } catch (error) {
        console.error(`\n❌ Error executing ${filePath}`);
        console.error(`\n💡 To resume, run: pnpm tsx scripts/seed-document-scrapes.ts --remote --start-from=${i + 1}\n`);
        throw error;
      }
    }

    console.log(`\n✅ Successfully seeded ${scrapes.length} document_scrapes to ${environment} database!`);

    // Cleanup: optionally delete the chunk files
    if (!noCleanup) {
      console.log('\n🧹 Cleaning up temporary SQL files...');
      for (const filePath of sqlFiles) {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
      console.log('✅ Cleanup complete!');
    } else {
      console.log('\n📁 Keeping SQL files (--no-cleanup flag set)');
    }

  } catch (error) {
    console.error('❌ Error seeding document_scrapes:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
