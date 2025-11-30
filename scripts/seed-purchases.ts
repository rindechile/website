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

  // Debug: Track foreign key values
  const municipalityIds = new Set<number>();
  const supplierRuts = new Set<string>();
  const itemIds = new Set<number>();
  const debugSamples: Purchase[] = [];

  for (const parts of rows) {
    const id = parts[0];

    // Skip if already exists
    if (purchasesMap.has(id)) {
      continue;
    }

    const purchase: Purchase = {
      id: parseInt(id, 10),
      chilecompra_code: parts[1],
      municipality_id: parseInt(parts[2], 10),
      supplier_rut: parts[3].toUpperCase(), // Normalize to uppercase for consistency
      quantity: parseInt(parts[4], 10),
      unit_total_price: parseFloat(parts[5]),
      is_expensive: parts[6].toLowerCase() === 'true',
      price_excess_amount: parseFloat(parts[7]),
      price_excess_percentage: parseFloat(parts[8]),
      item_id: parseInt(parts[9], 10),
    };

    purchasesMap.set(id, purchase);

    // Track foreign key values
    municipalityIds.add(purchase.municipality_id);
    supplierRuts.add(purchase.supplier_rut);
    itemIds.add(purchase.item_id);

    // Collect first 5 samples for debugging
    if (debugSamples.length < 5) {
      debugSamples.push(purchase);
    }
  }

  const purchases = Array.from(purchasesMap.values());

  // Debug output
  console.log('\n=== FOREIGN KEY ANALYSIS ===');
  console.log(`Total purchases: ${purchases.length}`);
  console.log(`Unique municipality_ids: ${municipalityIds.size}`);
  console.log(`Unique supplier_ruts: ${supplierRuts.size}`);
  console.log(`Unique item_ids: ${itemIds.size}`);

  console.log('\n=== MUNICIPALITY IDS (first 20) ===');
  console.log(Array.from(municipalityIds).slice(0, 20).sort((a, b) => a - b).join(', '));

  console.log('\n=== SUPPLIER RUTS (first 20) ===');
  console.log(Array.from(supplierRuts).slice(0, 20).sort().join(', '));

  console.log('\n=== ITEM IDS (first 20) ===');
  console.log(Array.from(itemIds).slice(0, 20).sort((a, b) => a - b).join(', '));

  console.log('\n=== SAMPLE PURCHASES ===');
  debugSamples.forEach((p, i) => {
    console.log(`Sample ${i + 1}:`, {
      id: p.id,
      municipality_id: p.municipality_id,
      supplier_rut: p.supplier_rut,
      item_id: p.item_id,
      chilecompra_code: p.chilecompra_code.substring(0, 20) + '...'
    });
  });

  // Check for potential issues
  const invalidMunicipalityIds = Array.from(municipalityIds).filter(id => isNaN(id) || id <= 0);
  const invalidItemIds = Array.from(itemIds).filter(id => isNaN(id) || id <= 0);
  const emptyRuts = Array.from(supplierRuts).filter(rut => !rut || rut.trim() === '');

  if (invalidMunicipalityIds.length > 0) {
    console.log('\n⚠️  WARNING: Invalid municipality_ids found:', invalidMunicipalityIds);
  }
  if (invalidItemIds.length > 0) {
    console.log('\n⚠️  WARNING: Invalid item_ids found:', invalidItemIds);
  }
  if (emptyRuts.length > 0) {
    console.log('\n⚠️  WARNING: Empty supplier_ruts found:', emptyRuts.length);
  }

  console.log('\n========================\n');

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