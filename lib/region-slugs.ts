/**
 * Region slug mapping for URL routing
 * Maps between region codes (1-16) and URL-friendly slugs
 */

export interface RegionSlugMapping {
  code: number;
  slug: string;
  name: string;
}

export const REGION_SLUGS: RegionSlugMapping[] = [
  { code: 1, slug: 'tarapaca', name: 'Región de Tarapacá' },
  { code: 2, slug: 'antofagasta', name: 'Región de Antofagasta' },
  { code: 3, slug: 'atacama', name: 'Región de Atacama' },
  { code: 4, slug: 'coquimbo', name: 'Región de Coquimbo' },
  { code: 5, slug: 'valparaiso', name: 'Región de Valparaíso' },
  { code: 6, slug: 'ohiggins', name: 'Región del Libertador Bernardo O\'Higgins' },
  { code: 7, slug: 'maule', name: 'Región del Maule' },
  { code: 8, slug: 'biobio', name: 'Región del Bío-Bío' },
  { code: 9, slug: 'araucania', name: 'Región de La Araucanía' },
  { code: 10, slug: 'lagos', name: 'Región de Los Lagos' },
  { code: 11, slug: 'aysen', name: 'Región de Aysén del Gral. Ibáñez del Campo' },
  { code: 12, slug: 'magallanes', name: 'Región de Magallanes y Antártica Chilena' },
  { code: 13, slug: 'santiago', name: 'Región Metropolitana de Santiago' },
  { code: 14, slug: 'rios', name: 'Región de Los Ríos' },
  { code: 15, slug: 'arica', name: 'Región de Arica y Parinacota' },
  { code: 16, slug: 'nuble', name: 'Región de Ñuble' },
];

// Create lookup maps for efficient access
const slugToCodeMap = new Map<string, number>(
  REGION_SLUGS.map(r => [r.slug, r.code])
);

const codeToSlugMap = new Map<number, string>(
  REGION_SLUGS.map(r => [r.code, r.slug])
);

const codeToNameMap = new Map<number, string>(
  REGION_SLUGS.map(r => [r.code, r.name])
);

/**
 * Get region code from URL slug
 * @param slug - URL slug (e.g., 'atacama')
 * @returns Region code (1-16) or null if invalid
 */
export function getCodeFromSlug(slug: string): number | null {
  return slugToCodeMap.get(slug) || null;
}

/**
 * Get URL slug from region code
 * @param code - Region code (1-16)
 * @returns URL slug or null if invalid
 */
export function getSlugFromCode(code: number): string | null {
  return codeToSlugMap.get(code) || null;
}

/**
 * Get region name from region code
 * @param code - Region code (1-16)
 * @returns Region name or null if invalid
 */
export function getRegionNameFromCode(code: number): string | null {
  return codeToNameMap.get(code) || null;
}

/**
 * Check if a slug is valid
 * @param slug - URL slug to validate
 * @returns true if slug is valid
 */
export function isValidSlug(slug: string): boolean {
  return slugToCodeMap.has(slug);
}

/**
 * Get region name from URL slug
 * @param slug - URL slug (e.g., 'atacama')
 * @returns Region name or null if invalid
 */
export function getRegionNameFromSlug(slug: string): string | null {
  const region = REGION_SLUGS.find(r => r.slug === slug);
  return region?.name || null;
}
