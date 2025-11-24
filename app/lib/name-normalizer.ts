/**
 * Normalizes municipality names to match between data sources
 * Handles variations like:
 * - "I MUNICIPALIDAD DE COINCO" -> "Coinco"
 * - "ILUSTRE MUNICIPALIDAD DE QUIRIHUE" -> "Quirihue"
 * - "I. MUNICIPALIDAD DE SANTIAGO" -> "Santiago"
 */

// Common prefixes to remove
const PREFIXES = [
  'ILUSTRE MUNICIPALIDAD DE ',
  'I MUNICIPALIDAD DE ',
  'I. MUNICIPALIDAD DE ',
  'MUNICIPALIDAD DE ',
  'MUNICIPALIDAD ',
  'I. ',
  'I ',
];

/**
 * Removes accents from a string for comparison purposes
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes a municipality name by removing common prefixes
 * and converting to title case
 */
export function normalizeMunicipalityName(name: string): string {
  if (!name) return '';
  
  // Trim and convert to uppercase for processing
  let normalized = name.trim().toUpperCase();
  
  // Remove prefixes
  for (const prefix of PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.substring(prefix.length);
      break;
    }
  }
  
  // Convert to title case
  return toTitleCase(normalized);
}

/**
 * Converts a string to title case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Keep certain words lowercase (articles, prepositions)
      const lowercaseWords = ['de', 'del', 'la', 'el', 'los', 'las', 'y'];
      if (lowercaseWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    // Capitalize first word regardless
    .replace(/^./, str => str.toUpperCase());
}

/**
 * Finds a matching key in the municipality data object
 * Uses fuzzy matching to handle slight variations
 */
export function findMunicipalityDataKey(
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
  
  // Third try: partial match (contains)
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

/**
 * Creates a mapping from GeoJSON comuna names to data keys
 */
export function createMunicipalityNameMapping(
  comunaNames: string[],
  dataKeys: string[]
): Map<string, string> {
  const mapping = new Map<string, string>();
  
  for (const comuna of comunaNames) {
    const matchingKey = findMunicipalityDataKey(comuna, dataKeys);
    if (matchingKey) {
      mapping.set(comuna, matchingKey);
    }
  }
  
  return mapping;
}

/**
 * Gets normalized name for display purposes
 */
export function getDisplayName(name: string): string {
  return normalizeMunicipalityName(name);
}

/**
 * Normalizes region names to match between GeoJSON and data sources
 * Handles variations like:
 * - "Región de Arica y Parinacota" -> "Region de Arica y Parinacota"
 * - "Región de Aysén del Gral.Ibañez del Campo" -> "Region Aysen del General Carlos IbaNez del Campo"
 */
export function normalizeRegionName(regionName: string): string {
  if (!regionName) return '';
  
  // Remove "Región" prefix and replace with "Region"
  let normalized = regionName.replace(/^Región\s+/i, 'Region ');
  
  // Handle specific name variations between GeoJSON and data_regions.json
  const regionMappings: Record<string, string> = {
    'Region de Aysén del Gral.Ibañez del Campo': 'Region Aysen del General Carlos IbaNez del Campo',
    'Region de Aysén del Gral. Carlos Ibáñez del Campo': 'Region Aysen del General Carlos IbaNez del Campo',
    'Region del Libertador Bernardo O\'Higgins': 'Region del Libertador General Bernardo OHiggins',
    'Region de Magallanes y Antártica Chilena': 'Region de Magallanes y de la Antartica',
    'Region de Magallanes y de la Antártica Chilena': 'Region de Magallanes y de la Antartica',
    'Region de la Araucanía': 'Region de la Araucania',
    'Region de La Araucanía': 'Region de la Araucania',
    'Region del Bío-Bío': 'Region del Biobio',
    'Region del Biobío': 'Region del Biobio',
    'Region de Ñuble': 'Region del Nuble',
    'Region de Los Rios': 'Region de los Rios',
    'Region de Los Ríos': 'Region de los Rios',
    'Region de Los Lagos': 'Region de los Lagos',
  };
  
  // Check if there's a specific mapping
  if (regionMappings[normalized]) {
    return regionMappings[normalized];
  }
  
  return normalized;
}

/**
 * Finds a matching key in the region data object
 * Uses fuzzy matching to handle slight variations
 */
export function findRegionDataKey(
  regionName: string,
  dataKeys: string[]
): string | null {
  const normalized = normalizeRegionName(regionName);
  
  // First try: exact match
  if (dataKeys.includes(normalized)) {
    return normalized;
  }
  
  // Second try: case-insensitive match without accents
  const lowerNormalized = removeAccents(normalized.toLowerCase());
  const match = dataKeys.find(key => 
    removeAccents(key.toLowerCase()) === lowerNormalized
  );
  
  return match || null;
}

/**
 * Maps normalized region names to display names with proper accents
 */
export const REGION_DISPLAY_NAMES: Record<string, string> = {
  'Region de Tarapaca': 'Región de Tarapacá',
  'Region de Antofagasta': 'Región de Antofagasta',
  'Region de Atacama': 'Región de Atacama',
  'Region de Coquimbo': 'Región de Coquimbo',
  'Region de Valparaiso': 'Región de Valparaíso',
  'Region del Libertador General Bernardo OHiggins': "Región del Libertador General Bernardo O'Higgins",
  'Region del Maule': 'Región del Maule',
  'Region del Biobio': 'Región del Bío-Bío',
  'Region de la Araucania': 'Región de La Araucanía',
  'Region de los Lagos': 'Región de Los Lagos',
  'Region Aysen del General Carlos IbaNez del Campo': 'Región de Aysén del Gral. Carlos Ibáñez del Campo',
  'Region de Magallanes y de la Antartica': 'Región de Magallanes y de la Antártica Chilena',
  'Region Metropolitana de Santiago': 'Región Metropolitana de Santiago',
  'Region de los Rios': 'Región de Los Ríos',
  'Region de Arica y Parinacota': 'Región de Arica y Parinacota',
  'Region del Nuble': 'Región de Ñuble',
};

/**
 * Gets the display name for a normalized region name
 */
export function getRegionDisplayName(normalizedName: string): string {
  return REGION_DISPLAY_NAMES[normalizedName] || normalizedName;
}
