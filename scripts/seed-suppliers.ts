#!/usr/bin/env node
/**
 * Seeds suppliers data
 * Reads from proveedor.csv and populates suppliers table
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

interface Supplier {
  rut: string;
  name: string;
  size: string;
}

function extractSupplierData(csvPath: string): Supplier[] {
  // Parse CSV
  const rows = parseCsv(csvPath);
  logCsvParsing(csvPath, rows.length);

  // Extract unique data
  logExtractionStart('suppliers');
  const suppliersMap = new Map<string, Supplier>();

  for (const parts of rows) {
    const rut = parts[0].toUpperCase(); // Normalize to uppercase for consistency

    // Skip if already exists
    if (suppliersMap.has(rut)) {
      continue;
    }

    suppliersMap.set(rut, {
      rut: rut,
      name: parts[1],
      size: parts[2],
    });
  }

  const suppliers = Array.from(suppliersMap.values());
  logExtractionResults({ suppliers: suppliers.length });

  return suppliers;
}

function generateSql(csvPath: string): string {
  const suppliers = extractSupplierData(csvPath);

  return generateBatchedInserts(
    'suppliers',
    ['rut', 'name', 'size'],
    suppliers,
    (s) => `('${escapeSqlString(s.rut)}', '${escapeSqlString(s.name)}', '${escapeSqlString(s.size)}')`,
    { batchSize: 500 }
  );
}

async function main() {
  await runSeedScript(
    {
      entityName: 'suppliers',
      csvPath: join(__dirname, '..', 'schemas', 'data', 'proveedor.csv'),
      sqlOutputPath: 'sql/seed-suppliers.sql',
      isRemote: isRemoteMode(),
    },
    generateSql
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});