#!/usr/bin/env node
/**
 * Seeds document_scrapes data from existing purchases
 * Creates a document_scrape entry for each unique chilecompra_code
 */

import { join } from 'path';
import {
  parseCsv,
  escapeSqlString,
  generateBatchedInserts,
  runSeedScript,
  isRemoteMode,
  logCsvParsing,
  logExtractionStart,
  logExtractionResults,
} from './seed-utils';

const MERCADO_PUBLICO_DETAIL_URL = 'https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx';

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

function generateSql(csvPath: string): string {
  const scrapes = extractDocumentScrapeData(csvPath);

  return generateBatchedInserts(
    'document_scrapes',
    [
      'purchase_id',
      'chilecompra_code',
      'detail_url',
      'scrape_status',
      'scrape_attempts',
      'created_at',
      'updated_at',
    ],
    scrapes,
    (s) =>
      `(${s.purchase_id}, '${escapeSqlString(s.chilecompra_code)}', '${escapeSqlString(s.detail_url)}', '${s.scrape_status}', ${s.scrape_attempts}, '${s.created_at}', '${s.updated_at}')`,
    { batchSize: 500 }
  );
}

async function main() {
  await runSeedScript(
    {
      entityName: 'document_scrapes',
      csvPath: join(__dirname, '..', 'schemas', 'data', 'purchase.csv'),
      sqlOutputPath: 'sql/seed-document-scrapes.sql',
      isRemote: isRemoteMode(),
    },
    generateSql
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
