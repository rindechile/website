import type {
  MunicipalityDataMap,
  RegionFeatureCollection,
  MunicipalityFeatureCollection,
  EnrichedRegionData,
  EnrichedMunicipalityData,
  RegionDataMap,
  RegionData,
  TreemapHierarchy,
  TreemapResponse,
} from '@/types/map';

import { findRegionDataKey } from './name-normalizer';
import municipalityData from '@/app/data/data_municipalities.json';
import regionData from '@/app/data/data_regions.json';
import municipalityNameMapping from '@/public/data/municipality_name_mapping.json';

// Cache for loaded GeoJSON data
const municipalityGeoJSONCache = new Map<number, MunicipalityFeatureCollection>();

// Pre-computed municipality name mapping (GeoJSON name -> data key)
type MunicipalityNameMapping = { [geoJsonName: string]: string };
const nameMapping = municipalityNameMapping as MunicipalityNameMapping;

// Region name to ID mapping (1-16)
const REGION_ID_MAP: { [regionName: string]: number } = {
  'Region de Tarapaca': 1,
  'Region de Antofagasta': 2,
  'Region de Atacama': 3,
  'Region de Coquimbo': 4,
  'Region de Valparaiso': 5,
  'Region del Libertador General Bernardo OHiggins': 6,
  'Region del Maule': 7,
  'Region del Biobio': 8,
  'Region de la Araucania': 9,
  'Region de los Lagos': 10,
  'Region Aysen del General Carlos IbaNez del Campo': 11,
  'Region de Magallanes y de la Antartica': 12,
  'Region Metropolitana de Santiago': 13,
  'Region de los Rios': 14,
  'Region de Arica y Parinacota': 15,
  'Region del Nuble': 16,
};

/**
 * Loads the Chile regions GeoJSON data
 */
export async function loadRegionsGeoJSON(): Promise<RegionFeatureCollection> {
  try {
    const response = await fetch('/data/chile_regions.json');
    if (!response.ok) {
      throw new Error(`Failed to load regions: ${response.statusText}`);
    }
    return await response.json() as RegionFeatureCollection;
  } catch (error) {
    console.error('Error loading regions GeoJSON:', error);
    throw new Error('Failed to load regions data');
  }
}

/**
 * Loads municipalities GeoJSON for a specific region
 */
export async function loadMunicipalitiesGeoJSON(
  regionCode: number
): Promise<MunicipalityFeatureCollection> {
  // Check cache first
  if (municipalityGeoJSONCache.has(regionCode)) {
    return municipalityGeoJSONCache.get(regionCode)!;
  }

  try {
    const response = await fetch(`/data/municipalities_by_region/${regionCode}.geojson`);
    if (!response.ok) {
      throw new Error(`Failed to load municipalities for region ${regionCode}: ${response.statusText}`);
    }
    const data = await response.json() as MunicipalityFeatureCollection;
    
    // Cache the result
    municipalityGeoJSONCache.set(regionCode, data);
    
    return data;
  } catch (error) {
    console.error(`Error loading municipalities for region ${regionCode}:`, error);
    throw new Error(`Failed to load municipalities for region ${regionCode}`);
  }
}

/**
 * Gets the municipality data map (already loaded from JSON import)
 */
export function getMunicipalityData(): MunicipalityDataMap {
  return municipalityData as MunicipalityDataMap;
}

/**
 * Gets the region data map (already loaded from JSON import)
 */
export function getRegionData(): RegionDataMap {
  return regionData as RegionDataMap;
}

/**
 * Gets the region ID (1-16) from a region name
 */
export function getRegionIdFromName(regionName: string): number | null {
  const data = getRegionData();
  const dataKeys = Object.keys(data);
  const matchingKey = findRegionDataKey(regionName, dataKeys);
  
  if (matchingKey && REGION_ID_MAP[matchingKey]) {
    return REGION_ID_MAP[matchingKey];
  }
  
  return null;
}

/**
 * Enriches municipality features with overpricing data
 * Uses pre-computed mapping for O(1) lookups instead of O(n) normalization
 */
export function enrichMunicipalityData(
  municipalityCollection: MunicipalityFeatureCollection
): EnrichedMunicipalityData[] {
  const data = getMunicipalityData();

  return municipalityCollection.features.map(feature => {
    const comunaName = feature.properties.Comuna;
    
    // Use pre-computed mapping for instant lookup
    const matchingKey = nameMapping[comunaName];
    
    if (!matchingKey) {
      console.warn(`No mapping found for municipality: ${comunaName}`);
    }
    
    return {
      feature,
      data: matchingKey ? data[matchingKey] : null,
      normalizedName: comunaName,
    };
  });
}

/**
 * Enriches all regions with pre-computed overpricing data
 * Uses data_regions.json instead of calculating on the fly
 * This eliminates 16 HTTP requests and computation time on initial load
 */
export function enrichRegionData(
  regionCollection: RegionFeatureCollection
): EnrichedRegionData[] {
  const data = getRegionData();
  const dataKeys = Object.keys(data);

  return regionCollection.features.map(feature => {
    const regionName = feature.properties.Region;
    const matchingKey = findRegionDataKey(regionName, dataKeys);
    
    if (matchingKey && data[matchingKey]) {
      const regionStats = data[matchingKey];
      return {
        feature,
        averageOverpricing: regionStats.porcentaje_sobreprecio,
        totalExpensivePurchases: regionStats.compras_caras,
        totalPurchases: regionStats.compras_totales,
      };
    }
    
    // Fallback if no matching data found
    console.warn(`No pre-computed data found for region: ${regionName}`);
    return {
      feature,
      averageOverpricing: 0,
      totalExpensivePurchases: 0,
      totalPurchases: 0,
    };
  });
}

/**
 * Gets the range of overpricing percentages across all municipality data
 */
export function getMunicipalityOverpricingRange(): [number, number] {
  const data = getMunicipalityData();
  const percentages = Object.values(data).map(d => d.porcentaje_sobreprecio);
  
  if (percentages.length === 0) {
    return [0, 100];
  }

  return [
    Math.min(...percentages),
    Math.max(...percentages),
  ];
}

/**
 * Gets the range of overpricing percentages across all region data
 */
export function getRegionOverpricingRange(): [number, number] {
  const data = getRegionData();
  const percentages = Object.values(data).map(d => d.porcentaje_sobreprecio);
  
  if (percentages.length === 0) {
    return [0, 100];
  }

  return [
    Math.min(...percentages),
    Math.max(...percentages),
  ];
}

/**
 * Calculates tertile breakpoints from a dataset (0-33%, 33-67%, 67-100%)
 */
export function calculateTertileBreakpoints(percentages: number[]): number[] {
  if (percentages.length === 0) {
    return [0, 33, 67];
  }
  
  const sorted = [...percentages].sort((a, b) => a - b);
  const n = sorted.length;
  
  return [
    sorted[0], // Min (0th percentile)
    sorted[Math.floor(n * 0.33)], // 33rd percentile
    sorted[Math.floor(n * 0.67)], // 67th percentile
  ];
}

/**
 * Gets tertile breakpoints for municipality data
 */
export function getMunicipalityTertileBreakpoints(): number[] {
  const data = getMunicipalityData();
  const percentages = Object.values(data).map(d => d.porcentaje_sobreprecio);
  return calculateTertileBreakpoints(percentages);
}

/**
 * Gets tertile breakpoints for region data
 */
export function getRegionTertileBreakpoints(): number[] {
  const data = getRegionData();
  const percentages = Object.values(data).map(d => d.porcentaje_sobreprecio);
  return calculateTertileBreakpoints(percentages);
}

/**
 * Gets the range of overpricing percentages across all data
 * @deprecated Use getMunicipalityOverpricingRange() or getRegionOverpricingRange() instead
 */
export function getOverpricingRange(): [number, number] {
  return getMunicipalityOverpricingRange();
}

/**
 * Aggregates country-level data from all regions
 */
export function getCountryData(): {
  porcentaje_sobreprecio: number;
  compras_caras: number;
  compras_totales: number;
} {
  const data = getRegionData();
  const regions = Object.values(data);
  
  if (regions.length === 0) {
    return {
      porcentaje_sobreprecio: 0,
      compras_caras: 0,
      compras_totales: 0,
    };
  }
  
  const totalComprasCaras = regions.reduce((sum, r) => sum + r.compras_caras, 0);
  const totalComprasTotales = regions.reduce((sum, r) => sum + r.compras_totales, 0);
  const avgOverpricing = regions.reduce((sum, r) => sum + r.porcentaje_sobreprecio, 0) / regions.length;
  
  return {
    porcentaje_sobreprecio: avgOverpricing,
    compras_caras: totalComprasCaras,
    compras_totales: totalComprasTotales,
  };
}

/**
 * Gets aggregated data for a specific region by region code
 */
export function getRegionDataByCode(regionCode: number): RegionData | null {
  const data = getRegionData();
  const regionName = Object.keys(REGION_ID_MAP).find(name => REGION_ID_MAP[name] === regionCode);
  
  if (!regionName) {
    return null;
  }
  
  const dataKeys = Object.keys(data);
  const regionKey = findRegionDataKey(regionName, dataKeys);
  
  if (!regionKey) {
    return null;
  }
  
  return data[regionKey] || null;
}

/**
 * Clears the municipality GeoJSON cache
 */
export function clearMunicipalityCache(): void {
  municipalityGeoJSONCache.clear();
}

/**
 * Preloads municipality data for a specific region
 */
export async function preloadMunicipalityData(regionCode: number): Promise<void> {
  if (!municipalityGeoJSONCache.has(regionCode)) {
    await loadMunicipalitiesGeoJSON(regionCode);
  }
}

/**
 * Fetches treemap data for visualization
 * @param level - 'country', 'region', or 'municipality'
 * @param code - Region ID or municipality ID (required for region/municipality)
 * @param categoryId - Category ID for drilling down to segments (optional)
 * @param segmentId - Segment ID for drilling down to families (optional)
 * @param familyId - Family ID for drilling down to classes (optional)
 */
export async function getTreemapData(
  level: 'country' | 'region' | 'municipality',
  code?: string,
  categoryId?: number,
  segmentId?: number,
  familyId?: number
): Promise<TreemapHierarchy | null> {
  try {
    const params = new URLSearchParams({ level });
    if (code) {
      params.append('code', code);
    }
    if (categoryId !== undefined) {
      params.append('categoryId', categoryId.toString());
    }
    if (segmentId !== undefined) {
      params.append('segmentId', segmentId.toString());
    }
    if (familyId !== undefined) {
      params.append('familyId', familyId.toString());
    }

    const response = await fetch(`/api/treemap?${params.toString()}`);

    if (!response.ok) {
      console.error(`Failed to fetch treemap data: ${response.statusText}`);
      return null;
    }

    const result: TreemapResponse = await response.json();

    if (!result.success || !result.data) {
      console.error('Treemap API returned unsuccessful response:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching treemap data:', error);
    return null;
  }
}

/**
 * Gets budget data for a specific municipality by name
 * @param municipalityName - The municipality name as it appears in the data JSON
 * @returns Budget and per capita budget, or null if not found
 */
export function getMunicipalityBudgetByName(municipalityName: string): {
  budget: number | null;
  budgetPerCapita: number | null;
} {
  const data = getMunicipalityData();
  const municipalityData = data[municipalityName];

  if (!municipalityData) {
    return { budget: null, budgetPerCapita: null };
  }

  return {
    budget: municipalityData.budget,
    budgetPerCapita: municipalityData.budget_per_capita,
  };
}

/**
 * Gets budget data for a specific region by region code
 * @param regionCode - The region code (1-16)
 * @returns Region budget, or null if not found
 */
export function getRegionBudgetByCode(regionCode: number): number | null {
  const regionData = getRegionDataByCode(regionCode);
  return regionData?.budget ?? null;
}

/**
 * Gets the country-level budget (sum of all region budgets)
 * @returns Total country budget, or null if no data available
 */
export function getCountryBudget(): number | null {
  const data = getRegionData();
  const regions = Object.values(data);

  // Filter out null budgets and sum
  const validBudgets = regions
    .map(r => r.budget)
    .filter((b): b is number => b !== null);

  if (validBudgets.length === 0) {
    return null;
  }

  return validBudgets.reduce((sum, budget) => sum + budget, 0);
}

