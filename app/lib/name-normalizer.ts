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

// Special case mappings for municipalities with different naming conventions
const SPECIAL_CASES: Record<string, string> = {
  // Add specific mappings if needed
  'CABO DE HORNOS': 'Cabo de Hornos',
  'LO ESPEJO': 'Lo Espejo',
  'LOS ANGELES': 'Los Ángeles',
  'LOS VILOS': 'Los Vilos',
  'LA FLORIDA': 'La Florida',
  'LO BARNECHEA': 'Lo Barnechea',
  'LO PRADO': 'Lo Prado',
  'LAS CONDES': 'Las Condes',
  'LA REINA': 'La Reina',
  'LA CISTERNA': 'La Cisterna',
  'LA GRANJA': 'La Granja',
  'LA PINTANA': 'La Pintana',
  'EL BOSQUE': 'El Bosque',
  'EL MONTE': 'El Monte',
  'O\'HIGGINS': "O'Higgins",
};

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
  
  // Check special cases first (exact match)
  if (SPECIAL_CASES[normalized]) {
    return SPECIAL_CASES[normalized];
  }
  
  // Remove prefixes
  for (const prefix of PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.substring(prefix.length);
      break;
    }
  }
  
  // Check if the remaining part is in special cases
  if (SPECIAL_CASES[normalized]) {
    return SPECIAL_CASES[normalized];
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
