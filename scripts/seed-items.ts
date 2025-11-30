#!/usr/bin/env node
/**
 * Seeds items data
 * Reads from tipo_producto.csv and populates items table
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

interface Item {
  expected_min_range: number;
  expected_max_range: number;
  max_acceptable_price: number;
  commodity_id: number;
  id: number;
  name: string;
  has_sufficient_data: number;
}

function extractItemData(csvPath: string): Item[] {
  // Parse CSV
  const rows = parseCsv(csvPath);
  logCsvParsing(csvPath, rows.length);

  // Extract unique data
  logExtractionStart('items');
  const itemsMap = new Map<string, Item>();

  for (const parts of rows) {
    const id = parts[4];
    const name = parts[5];
    const hasData = (parts[6] || '').toString().trim().toLowerCase() === 'true' ? 1 : 0;

    const newItem: Item = {
      expected_min_range: parseInt(parts[0], 10),
      expected_max_range: parseInt(parts[1], 10),
      max_acceptable_price: parseFloat(parts[2]),
      commodity_id: parseInt(parts[3], 10),
      id: parseInt(id, 10),
      name,
      has_sufficient_data: hasData,
    };

    // If ID already exists, prefer the version without encoding corruption
    if (itemsMap.has(id)) {
      const existingItem = itemsMap.get(id)!;
      const hasCorruption = (str: string) => str.includes('Ï¿½') || str.includes('�');

      // Only replace if new item has better quality (no corruption)
      if (hasCorruption(existingItem.name) && !hasCorruption(name)) {
        itemsMap.set(id, newItem);
      }
      continue;
    }

    itemsMap.set(id, newItem);
  }

  const items = Array.from(itemsMap.values());
  logExtractionResults({ items: items.length });

  return items;
}

function generateSql(csvPath: string): string {
  const items = extractItemData(csvPath);

  return generateBatchedInserts(
    'items',
    ['expected_min_range', 'expected_max_range', 'max_acceptable_price', 'commodity_id', 'id', 'name', 'has_sufficient_data'],
    items,
    (item) =>
      `(${item.expected_min_range}, ${item.expected_max_range}, ${item.max_acceptable_price}, ${item.commodity_id}, ${item.id}, '${escapeSqlString(item.name)}', ${item.has_sufficient_data})`,
    { batchSize: 500 }
  );
}

async function main() {
  await runSeedScript(
    {
      entityName: 'items',
      csvPath: join(__dirname, '..', 'schemas', 'data', 'tipo_producto.csv'),
      sqlOutputPath: 'sql/seed-items.sql',
      isRemote: isRemoteMode(),
    },
    generateSql
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});