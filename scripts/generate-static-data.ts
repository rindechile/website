#!/usr/bin/env node
/**
 * Generates static JSON files with overpricing and budget data
 * Sources:
 * - Overpricing: From existing data_municipalities.json and data_regions.json
 * - Budget: From database query (via Wrangler D1)
 *
 * Output: Enhanced JSON files in app/data/
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Type for the municipality name mapping (GeoJSON name -> data key)
type MunicipalityNameMapping = { [geoJsonName: string]: string };

interface MunicipalityInput {
  id: number;
  name: string;
  budget: number | null;
  budget_per_capita: number | null;
  region_id: number;
}

interface MunicipalityOutput {
  porcentaje_sobreprecio: number;
  compras_caras: number;
  compras_totales: number;
  budget: number | null;
  budget_per_capita: number | null;
}

interface RegionOutput {
  porcentaje_sobreprecio: number;
  compras_caras: number;
  compras_totales: number;
  budget: number | null;
}

// Region ID to name mapping (matches REGION_ID_MAP in data-service.ts)
const REGION_NAMES: Record<number, string> = {
  1: 'Region de Tarapaca',
  2: 'Region de Antofagasta',
  3: 'Region de Atacama',
  4: 'Region de Coquimbo',
  5: 'Region de Valparaiso',
  6: 'Region del Libertador General Bernardo OHiggins',
  7: 'Region del Maule',
  8: 'Region del Biobio',
  9: 'Region de la Araucania',
  10: 'Region de los Lagos',
  11: 'Region Aysen del General Carlos IbaNez del Campo',
  12: 'Region de Magallanes y de la Antartica',
  13: 'Region Metropolitana de Santiago',
  14: 'Region de los Rios',
  15: 'Region de Arica y Parinacota',
  16: 'Region del Nuble',
};

/**
 * Load the municipality name mapping (GeoJSON name -> data key)
 */
function loadMunicipalityNameMapping(projectRoot: string): Map<string, string> {
  const mappingPath = join(projectRoot, 'public', 'data', 'municipality_name_mapping.json');
  const mappingData = JSON.parse(readFileSync(mappingPath, 'utf-8')) as MunicipalityNameMapping;

  // Create a reverse mapping: for each database name (which is like the GeoJSON name),
  // find what key it maps to in the data JSON
  const mapping = new Map<string, string>();
  for (const [geoJsonName, dataKey] of Object.entries(mappingData)) {
    mapping.set(geoJsonName, dataKey);
  }

  console.log(`📋 Loaded name mapping with ${mapping.size} entries`);
  return mapping;
}

/**
 * Fetch municipality budget data from the database using Wrangler
 */
function fetchMunicipalityBudgetsFromDB(isRemote: boolean = false, nameMapping?: Map<string, string>): Map<string, { budget: number | null; budget_per_capita: number | null }> {
  console.log('📊 Fetching municipality budget data from database...');

  const environment = isRemote ? '--remote' : '--local';

  try {
    // Execute query via Wrangler
    const command = `wrangler d1 execute DB ${environment} --json --command="SELECT id, name, budget, budget_per_capita, region_id FROM municipalities"`;
    const output = execSync(command, { encoding: 'utf-8' });

    // Wrangler outputs text + JSON, need to extract just the JSON part
    // Look for the first '[' character which starts the JSON array
    const jsonStartIndex = output.indexOf('[');
    if (jsonStartIndex === -1) {
      throw new Error('No JSON found in wrangler output');
    }
    const jsonString = output.substring(jsonStartIndex);

    // Parse the Wrangler JSON output
    const result = JSON.parse(jsonString);

    // Wrangler returns an array of result objects
    const results = result[0]?.results || [];

    const budgetMap = new Map<string, { budget: number | null; budget_per_capita: number | null }>();

    for (const row of results) {
      const dbName = row.name as string;
      const budget = typeof row.budget === 'number' ? row.budget : null;
      const budget_per_capita = typeof row.budget_per_capita === 'number' ? row.budget_per_capita : null;

      // Use the name mapping to convert database name to JSON key
      // If no mapping exists, try the database name directly
      const jsonKey = nameMapping?.get(dbName) || dbName;

      budgetMap.set(jsonKey, { budget, budget_per_capita });
    }

    console.log(`✅ Fetched budget data for ${budgetMap.size} municipalities`);
    return budgetMap;

  } catch (error) {
    console.error('❌ Error fetching budget data from database:', error);
    throw new Error('Failed to fetch budget data. Make sure the database is seeded and Wrangler is configured.');
  }
}

/**
 * Generate enhanced municipality JSON with budget data
 */
function generateMunicipalityData(
  existingDataPath: string,
  budgetMap: Map<string, { budget: number | null; budget_per_capita: number | null }>,
  outputPath: string
): void {
  console.log('📊 Generating enhanced municipality data...');

  // Load existing overpricing data
  const existingData = JSON.parse(readFileSync(existingDataPath, 'utf-8')) as Record<string, {
    porcentaje_sobreprecio: number;
    compras_caras: number;
    compras_totales: number;
  }>;

  // Merge data
  const enhancedData: Record<string, MunicipalityOutput> = {};
  let matchCount = 0;
  let unmatchedCount = 0;

  for (const [municipalityName, overpricingData] of Object.entries(existingData)) {
    const budgetData = budgetMap.get(municipalityName);

    enhancedData[municipalityName] = {
      ...overpricingData,
      budget: budgetData?.budget ?? null,
      budget_per_capita: budgetData?.budget_per_capita ?? null,
    };

    if (budgetData) {
      matchCount++;
    } else {
      unmatchedCount++;
      console.warn(`⚠️  No budget data found for: ${municipalityName}`);
    }
  }

  // Write enhanced JSON
  writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf-8');
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`   - Total municipalities: ${Object.keys(enhancedData).length}`);
  console.log(`   - With budget: ${matchCount}`);
  console.log(`   - Without budget: ${unmatchedCount}`);
}

/**
 * Generate enhanced region JSON with budget data (aggregated from municipalities)
 */
function generateRegionData(
  existingDataPath: string,
  budgetMap: Map<string, { budget: number | null; budget_per_capita: number | null }>,
  municipalityDataPath: string,
  outputPath: string
): void {
  console.log('📊 Generating enhanced region data...');

  // Load existing overpricing data
  const existingData = JSON.parse(readFileSync(existingDataPath, 'utf-8')) as Record<string, {
    porcentaje_sobreprecio: number;
    compras_caras: number;
    compras_totales: number;
  }>;

  // We need to fetch municipalities again with region_id to aggregate by region
  // Let's query the database for this
  const environment = process.env.REMOTE_DB === 'true' ? '--remote' : '--local';

  try {
    const command = `wrangler d1 execute DB ${environment} --json --command="SELECT region_id, budget FROM municipalities WHERE budget IS NOT NULL"`;
    const output = execSync(command, { encoding: 'utf-8' });

    // Extract JSON from wrangler output
    const jsonStartIndex = output.indexOf('[');
    if (jsonStartIndex === -1) {
      throw new Error('No JSON found in wrangler output');
    }
    const jsonString = output.substring(jsonStartIndex);
    const result = JSON.parse(jsonString);
    const results = result[0]?.results || [];

    // Aggregate budgets by region
    const regionBudgets = new Map<number, number>();

    for (const row of results) {
      const region_id = row.region_id as number;
      const budget = row.budget as number;

      const currentTotal = regionBudgets.get(region_id) || 0;
      regionBudgets.set(region_id, currentTotal + budget);
    }

    // Merge data
    const enhancedData: Record<string, RegionOutput> = {};

    for (const [regionName, overpricingData] of Object.entries(existingData)) {
      // Find region ID by name
      const regionId = Object.entries(REGION_NAMES).find(([_, name]) => name === regionName)?.[0];
      const budget = regionId ? regionBudgets.get(parseInt(regionId)) ?? null : null;

      enhancedData[regionName] = {
        ...overpricingData,
        budget,
      };
    }

    // Write enhanced JSON
    writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf-8');
    console.log(`✅ Generated: ${outputPath}`);
    console.log(`   - Total regions: ${Object.keys(enhancedData).length}`);
    console.log(`   - With budget: ${Object.values(enhancedData).filter(d => d.budget !== null).length}`);

  } catch (error) {
    console.error('❌ Error generating region data:', error);
    throw error;
  }
}

async function main() {
  const projectRoot = join(__dirname, '..');
  const isRemote = process.env.REMOTE_DB === 'true';

  console.log(`\n🚀 Generating static data from ${isRemote ? 'REMOTE' : 'LOCAL'} database...\n`);

  // Paths
  const existingMunicipalityDataPath = join(projectRoot, 'app', 'data', 'data_municipalities.json');
  const existingRegionDataPath = join(projectRoot, 'app', 'data', 'data_regions.json');
  const outputMunicipalityPath = join(projectRoot, 'app', 'data', 'data_municipalities.json');
  const outputRegionPath = join(projectRoot, 'app', 'data', 'data_regions.json');

  try {
    // Load name mapping first
    const nameMapping = loadMunicipalityNameMapping(projectRoot);

    // Fetch budget data from database
    const budgetMap = fetchMunicipalityBudgetsFromDB(isRemote, nameMapping);

    // Generate both files
    generateMunicipalityData(existingMunicipalityDataPath, budgetMap, outputMunicipalityPath);
    generateRegionData(existingRegionDataPath, budgetMap, existingMunicipalityDataPath, outputRegionPath);

    console.log('\n✨ Static data generation complete!\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
