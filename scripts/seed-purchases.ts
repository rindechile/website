#!/usr/bin/env node
/**
 * Seeds purchases data
 * Reads from purchase.csv and populates purchases table
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

interface Purchase {
  id: number;
  chilecompra_code: string;
  municipality_id: number;
  supplier_rut: string;
  quantity: number;
  unit_total_price: number;
  is_expensive: boolean;
  price_excess_amount: number;
  price_excess_percentage: number;
  item_id: number;
}

function extractPurchaseData(csvPath: string): Purchase[] {
  // Parse CSV
  const rows = parseCsv(csvPath);
  logCsvParsing(csvPath, rows.length);

  // Extract unique data
  logExtractionStart('purchases');
  const purchasesMap = new Map<string, Purchase>();

  for (const parts of rows) {
    const id = parts[0];

    // Skip if already exists
    if (purchasesMap.has(id)) {
      continue;
    }

    purchasesMap.set(id, {
      id: parseInt(id, 10),
      chilecompra_code: parts[1],
      municipality_id: parseInt(parts[2], 10),
      supplier_rut: parts[3],
      quantity: parseInt(parts[4], 10),
      unit_total_price: parseFloat(parts[5]),
      is_expensive: parts[6].toLowerCase() === 'true',
      price_excess_amount: parseFloat(parts[7]),
      price_excess_percentage: parseFloat(parts[8]),
      item_id: parseInt(parts[9], 10),
    });
  }

  const purchases = Array.from(purchasesMap.values());
  logExtractionResults({ purchases: purchases.length });

  return purchases;
}

function generateSql(csvPath: string): string {
  const purchases = extractPurchaseData(csvPath);

  return generateBatchedInserts(
    'purchases',
    ['id', 'chilecompra_code', 'municipality_id', 'supplier_rut', 'quantity', 'unit_total_price', 'is_expensive', 'price_excess_amount', 'price_excess_percentage', 'item_id'],
    purchases,
    (p) =>
      `(${p.id}, '${escapeSqlString(p.chilecompra_code)}', ${p.municipality_id}, '${escapeSqlString(p.supplier_rut)}', ${p.quantity}, ${p.unit_total_price}, ${p.is_expensive ? 1 : 0}, ${p.price_excess_amount}, ${p.price_excess_percentage}, ${p.item_id})`,
    { batchSize: 500 }
  );
}

async function main() {
  await runSeedScript(
    {
      entityName: 'purchases',
      csvPath: join(__dirname, '..', 'schemas', 'data', 'purchase.csv'),
      sqlOutputPath: 'sql/seed-purchases.sql',
      isRemote: isRemoteMode(),
    },
    generateSql
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});