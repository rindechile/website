#!/usr/bin/env node
/**
 * Seeds municipalities data
 * Reads from municipalities.csv and populates municipalities table
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

interface Municipality {
  id: number;
  name: string;
  budget: number;
  budget_per_capita: number;
  region_id: number;
}

function extractMunicipalityData(csvPath: string): Municipality[] {
  // Parse CSV
  const rows = parseCsv(csvPath);
  logCsvParsing(csvPath, rows.length);

  // Extract unique data
  logExtractionStart('municipalities');
  const municipalitiesMap = new Map<string, Municipality>();

  for (const parts of rows) {
    const id = parts[0];

    // Skip if already exists
    if (municipalitiesMap.has(id)) {
      continue;
    }

    municipalitiesMap.set(id, {
      id: parseInt(id, 10),
      name: parts[1],
      budget: parseFloat(parts[2]),
      budget_per_capita: parseFloat(parts[3]),
      region_id: parseInt(parts[4], 10),
    });
  }

  const municipalities = Array.from(municipalitiesMap.values());
  logExtractionResults({ municipalities: municipalities.length });

  return municipalities;
}

function generateSql(csvPath: string): string {
  const municipalities = extractMunicipalityData(csvPath);

  return generateBatchedInserts(
    'municipalities',
    ['id', 'name', 'budget', 'budget_per_capita', 'region_id'],
    municipalities,
    (m) => `(${m.id}, '${escapeSqlString(m.name)}', ${m.budget}, ${m.budget_per_capita}, ${m.region_id})`,
    { batchSize: 500 }
  );
}

async function main() {
  await runSeedScript(
    {
      entityName: 'municipalities',
      csvPath: join(__dirname, '..', 'schemas', 'data', 'municipalities.csv'),
      sqlOutputPath: 'sql/seed-municipalities.sql',
      isRemote: isRemoteMode(),
    },
    generateSql
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
