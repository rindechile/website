#!/usr/bin/env node
/**
 * Seeds regions data
 * Reads from region.csv and populates regions table
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

interface Region {
  id: number;
  name: string;
}

function extractRegionData(csvPath: string): Region[] {
  // Parse CSV
  const rows = parseCsv(csvPath);
  logCsvParsing(csvPath, rows.length);

  // Extract unique data
  logExtractionStart('regions');
  const regionsMap = new Map<number, Region>();

  for (const parts of rows) {
    const regionId = parseInt(parts[0], 10);

    // Skip if already exists
    if (regionsMap.has(regionId)) {
      continue;
    }

    regionsMap.set(regionId, {
      id: regionId,
      name: parts[1],
    });
  }

  const regions = Array.from(regionsMap.values());
  logExtractionResults({ regions: regions.length });

  return regions;
}

function generateSql(csvPath: string): string {
  const regions = extractRegionData(csvPath);

  return generateBatchedInserts(
    'regions',
    ['id', 'name'],
    regions,
    (region) => `(${region.id}, '${escapeSqlString(region.name)}')`,
    { batchSize: 500 }
  );
}

async function main() {
  await runSeedScript(
    {
      entityName: 'regions',
      csvPath: join(__dirname, '..', 'schemas', 'data', 'region.csv'),
      sqlOutputPath: 'sql/seed-region.sql',
      isRemote: isRemoteMode(),
    },
    generateSql
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});