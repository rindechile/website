#!/usr/bin/env node
/**
 * Generates a pre-computed mapping from GeoJSON municipality names to data_municipalities.json keys
 * This eliminates the need for runtime normalization when loading municipality data
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Import normalization logic
const PREFIXES = [
  'ILUSTRE MUNICIPALIDAD DE ',
  'I MUNICIPALIDAD DE ',
  'I. MUNICIPALIDAD DE ',
  'MUNICIPALIDAD DE ',
  'MUNICIPALIDAD ',
  'I. ',
  'I ',
];

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      const lowercaseWords = ['de', 'del', 'la', 'el', 'los', 'las', 'y'];
      if (lowercaseWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^./, str => str.toUpperCase());
}

function normalizeMunicipalityName(name: string): string {
  if (!name) return '';
  
  let normalized = name.trim().toUpperCase();
  
  for (const prefix of PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.substring(prefix.length);
      break;
    }
  }
  
  return toTitleCase(normalized);
}

function findMunicipalityDataKey(
  comunaName: string,
  dataKeys: string[]
): string | null {
  const normalizedComuna = normalizeMunicipalityName(comunaName);
  
  // First try: exact match on normalized names
  for (const key of dataKeys) {
    const normalizedKey = normalizeMunicipalityName(key);
    if (normalizedKey === normalizedComuna) {
      return key;
    }
  }
  
  // Second try: match without accents
  const comunaNoAccents = removeAccents(normalizedComuna).toLowerCase();
  for (const key of dataKeys) {
    const keyNoAccents = removeAccents(normalizeMunicipalityName(key)).toLowerCase();
    if (keyNoAccents === comunaNoAccents) {
      return key;
    }
  }
  
  // Third try: handle special cases with typos in data
  const specialCases: { [key: string]: string } = {
    'Combarbalá': 'ILUSTRE MINICIPALIDAD DE COMBARBALA', // Typo in original: MINICIPALIDAD
    'Cochamó': 'ILUSTRE MUNICIPALIDAD COCHAMO', // Missing accent in original
    'Llaillay': 'I MUNICIPALIDAD DE LLAY LLAY', // Different spacing
    'Monte Patria': 'I MUNICIPALIDAD DE MONTEPATRIA', // Different spacing
    'Estación Central': 'I MUNICIPALIDAD ESTACION CENTRAL', // Missing accent in original
    'San Joaquín': 'I MUNICIPALIDAD SAN JOAQUIN', // Missing accent in original
    'Tiltil': 'I MUNICIPALIDAD DE TIL TIL', // Different spacing
    'El Bosque': 'I MUNICIPALIDAD DE LA COMUNA DE EL BOSQUE', // Extra words in original
    'Treguaco': 'I MUNICIPALIDAD DE TREHUACO', // Different spelling
    'Río Ibáñez': 'I MUNICIPALIDAD RIO IBANEZ', // Missing accent in original
    "O'Higgins": 'I MUNICIPALIDAD DE O HIGGINS', // Missing apostrophe in original
  };
  
  if (specialCases[comunaName]) {
    const specialKey = specialCases[comunaName];
    if (dataKeys.includes(specialKey)) {
      return specialKey;
    }
  }
  
  // Fourth try: partial match (contains)
  for (const key of dataKeys) {
    const normalizedKey = normalizeMunicipalityName(key);
    if (
      normalizedKey.includes(normalizedComuna) ||
      normalizedComuna.includes(normalizedKey)
    ) {
      return key;
    }
  }
  
  return null;
}

// Patterns to identify non-municipality entries (associations, etc.)
const NON_MUNICIPALITY_PATTERNS = [
  /^ASOCIACION/i,
  /^ASOCIACIÓN/i,
  /REGION/i,
  /REGIONAL/i,
];

function isAssociation(key: string): boolean {
  return NON_MUNICIPALITY_PATTERNS.some(pattern => pattern.test(key));
}

interface MunicipalityFeature {
  properties: {
    Comuna: string;
    codregion: number;
  };
}

interface MunicipalityGeoJSON {
  features: MunicipalityFeature[];
}

interface MunicipalityMapping {
  [geoJsonName: string]: string;
}

async function generateMapping() {
  console.log('🗺️  Generating municipality name mapping...\n');
  
  const projectRoot = join(__dirname, '..');
  
  // Load municipality data
  const municipalityDataPath = join(projectRoot, 'app/data/data_municipalities.json');
  const municipalityData = JSON.parse(readFileSync(municipalityDataPath, 'utf-8'));
  const dataKeys = Object.keys(municipalityData);
  
  console.log(`📊 Loaded ${dataKeys.length} entries from data_municipalities.json`);
  
  // Filter out associations
  const municipalityKeys = dataKeys.filter(key => !isAssociation(key));
  const associationKeys = dataKeys.filter(key => isAssociation(key));
  
  console.log(`   ✓ ${municipalityKeys.length} municipality entries`);
  console.log(`   ✓ ${associationKeys.length} association entries (skipped)\n`);
  
  const mapping: MunicipalityMapping = {};
  const unmappedMunicipalities: string[] = [];
  const regionStats: { [regionId: number]: { mapped: number; unmapped: number } } = {};
  
  // Process all 16 regions
  for (let regionId = 1; regionId <= 16; regionId++) {
    const geoJsonPath = join(projectRoot, `public/data/municipalities_by_region/${regionId}.geojson`);
    
    try {
      const geoJson: MunicipalityGeoJSON = JSON.parse(readFileSync(geoJsonPath, 'utf-8'));
      const municipalitiesInRegion = geoJson.features;
      
      regionStats[regionId] = { mapped: 0, unmapped: 0 };
      
      for (const feature of municipalitiesInRegion) {
        const comunaName = feature.properties.Comuna;
        
        // Skip if already mapped (some municipalities might appear in multiple regions)
        if (mapping[comunaName]) {
          regionStats[regionId].mapped++;
          continue;
        }
        
        const matchingKey = findMunicipalityDataKey(comunaName, municipalityKeys);
        
        if (matchingKey) {
          mapping[comunaName] = matchingKey;
          regionStats[regionId].mapped++;
        } else {
          unmappedMunicipalities.push(`${comunaName} (Region ${regionId})`);
          regionStats[regionId].unmapped++;
        }
      }
      
      console.log(`Region ${regionId.toString().padStart(2)}: ${regionStats[regionId].mapped} mapped, ${regionStats[regionId].unmapped} unmapped`);
      
    } catch (error) {
      console.error(`❌ Error processing region ${regionId}:`, error);
    }
  }
  
  // Write mapping to file
  const outputPath = join(projectRoot, 'public/data/municipality_name_mapping.json');
  writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf-8');
  
  console.log(`\n✅ Mapping generated successfully!`);
  console.log(`   📁 Output: ${outputPath}`);
  console.log(`   📊 Total mappings: ${Object.keys(mapping).length}`);
  
  // Report unmapped municipalities
  if (unmappedMunicipalities.length > 0) {
    console.log(`\n⚠️  Warning: ${unmappedMunicipalities.length} municipalities could not be mapped:`);
    unmappedMunicipalities.forEach(name => {
      console.log(`   • ${name}`);
    });
  } else {
    console.log(`\n✨ All municipalities successfully mapped!`);
  }
  
  console.log('\n');
}

generateMapping().catch(error => {
  console.error('❌ Error generating mapping:', error);
  process.exit(1);
});
