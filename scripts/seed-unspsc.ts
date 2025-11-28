#!/usr/bin/env node
/**
 * Seeds UNSPSC (United Nations Standard Products and Services Code) tables
 * Reads from clean_unspsc_data.csv and populates categories, segments, families, classes, and commodities tables
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
import { categories, getCategoryIdForSegment } from './seed-categories';

interface UnspscData {
  categories: Array<{ id: number; name: string }>;
  segments: Array<{ id: number; categoryId: number; name: string }>;
  families: Array<{ id: number; segmentId: number; name: string }>;
  classes: Array<{ id: number; familyId: number; name: string }>;
  commodities: Array<{ id: number; classId: number; name: string }>;
}

function extractUnspscData(csvPath: string): UnspscData {
  // Parse CSV
  const rows = parseCsv(csvPath);
  logCsvParsing(csvPath, rows.length);

  // Extract unique data
  logExtractionStart('UNSPSC entities');

  const segmentsMap = new Map<number, { id: number; categoryId: number; name: string }>();
  const familiesMap = new Map<number, { id: number; segmentId: number; name: string }>();
  const classesMap = new Map<number, { id: number; familyId: number; name: string }>();
  const commoditiesMap = new Map<number, { id: number; classId: number; name: string }>();

  for (const parts of rows) {
    // Validate we have enough parts
    if (parts.length < 8) {
      console.warn(`Skipping invalid row with only ${parts.length} columns`);
      continue;
    }

    const segmentCode = parseInt(parts[0], 10);
    const familyCode = parseInt(parts[2], 10);
    const classCode = parseInt(parts[4], 10);
    const commodityCode = parseInt(parts[6], 10);

    // Validate all codes are valid numbers
    if (isNaN(segmentCode) || isNaN(familyCode) || isNaN(classCode) || isNaN(commodityCode)) {
      console.warn(`Skipping row with invalid codes: segment=${parts[0]}, family=${parts[2]}, class=${parts[4]}, commodity=${parts[6]}`);
      continue;
    }

    // Add segment if not exists
    if (!segmentsMap.has(segmentCode)) {
      const categoryId = getCategoryIdForSegment(parts[0]);
      segmentsMap.set(segmentCode, {
        id: segmentCode,
        categoryId,
        name: parts[1],
      });
    }

    // Add family if not exists
    if (!familiesMap.has(familyCode)) {
      familiesMap.set(familyCode, {
        id: familyCode,
        segmentId: segmentCode,
        name: parts[3],
      });
    }

    // Add class if not exists
    if (!classesMap.has(classCode)) {
      classesMap.set(classCode, {
        id: classCode,
        familyId: familyCode,
        name: parts[5],
      });
    }

    // Add commodity
    commoditiesMap.set(commodityCode, {
      id: commodityCode,
      classId: classCode,
      name: parts[7],
    });
  }

  const categoriesArray = categories.map(c => ({ id: c.id, name: c.name }));
  const segments = Array.from(segmentsMap.values());
  const families = Array.from(familiesMap.values());
  const classes = Array.from(classesMap.values());
  const commodities = Array.from(commoditiesMap.values());

  logExtractionResults({
    categories: categoriesArray.length,
    segments: segments.length,
    families: families.length,
    classes: classes.length,
    commodities: commodities.length,
  });

  return { categories: categoriesArray, segments, families, classes, commodities };
}

function generateSql(csvPath: string): string {
  const data = extractUnspscData(csvPath);
  const sqlParts: string[] = [];

  // Insert categories
  const categoriesSql = generateBatchedInserts(
    'categories',
    ['id', 'name'],
    data.categories,
    (c) => `(${c.id}, '${escapeSqlString(c.name)}')`,
    { batchSize: 500 }
  );
  sqlParts.push(categoriesSql);

  // Insert segments (filter out any with NaN values)
  const validSegments = data.segments.filter(s => !isNaN(s.id) && !isNaN(s.categoryId));
  const segmentsSql = generateBatchedInserts(
    'segments',
    ['id', 'category_id', 'name'],
    validSegments,
    (s) => `(${s.id}, ${s.categoryId}, '${escapeSqlString(s.name)}')`,
    { batchSize: 500 }
  );
  sqlParts.push(segmentsSql);

  // Insert families (filter out any with NaN values)
  const validFamilies = data.families.filter(f => !isNaN(f.id) && !isNaN(f.segmentId));
  const familiesSql = generateBatchedInserts(
    'families',
    ['id', 'segment_id', 'name'],
    validFamilies,
    (f) => `(${f.id}, ${f.segmentId}, '${escapeSqlString(f.name)}')`,
    { batchSize: 500 }
  );
  sqlParts.push(familiesSql);

  // Insert classes (filter out any with NaN values)
  const validClasses = data.classes.filter(c => !isNaN(c.id) && !isNaN(c.familyId));
  const classesSql = generateBatchedInserts(
    'classes',
    ['id', 'family_id', 'name'],
    validClasses,
    (c) => `(${c.id}, ${c.familyId}, '${escapeSqlString(c.name)}')`,
    { batchSize: 500 }
  );
  sqlParts.push(classesSql);

  // Insert commodities (filter out any with NaN values)
  const validCommodities = data.commodities.filter(c => !isNaN(c.id) && !isNaN(c.classId));
  const commoditiesSql = generateBatchedInserts(
    'commodities',
    ['id', 'class_id', 'name'],
    validCommodities,
    (c) => `(${c.id}, ${c.classId}, '${escapeSqlString(c.name)}')`,
    { batchSize: 500 }
  );
  sqlParts.push(commoditiesSql);

  return sqlParts.join('\n\n');
}

async function main() {
  await runSeedScript(
    {
      entityName: 'UNSPSC',
      csvPath: join(__dirname, '..', 'schemas', 'data', 'clean_unspsc_data.csv'),
      sqlOutputPath: 'sql/seed-unspsc.sql',
      isRemote: isRemoteMode(),
    },
    generateSql
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
