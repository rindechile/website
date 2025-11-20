import type {
  MunicipalityDataMap,
  RegionFeatureCollection,
  MunicipalityFeatureCollection,
  EnrichedRegionData,
  EnrichedMunicipalityData,
  RegionDataMap,
} from '@/types/map';
import { findMunicipalityDataKey, findRegionDataKey } from './name-normalizer';
import municipalityData from '@/app/data/data_municipalities.json';
import regionData from '@/app/data/data_regions.json';

// Cache for loaded GeoJSON data
const municipalityGeoJSONCache = new Map<number, MunicipalityFeatureCollection>();

/**
 * Loads the Chile regions GeoJSON data
 */
export async function loadRegionsGeoJSON(): Promise<RegionFeatureCollection> {
  try {
    const response = await fetch('/data/chile_regions.json');
    if (!response.ok) {
      throw new Error(`Failed to load regions: ${response.statusText}`);
    }
    return await response.json();
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
    const data = await response.json();
    
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
 * Enriches municipality features with overpricing data
 */
export function enrichMunicipalityData(
  municipalityCollection: MunicipalityFeatureCollection
): EnrichedMunicipalityData[] {
  const data = getMunicipalityData();
  const dataKeys = Object.keys(data);

  return municipalityCollection.features.map(feature => {
    const comunaName = feature.properties.Comuna;
    const matchingKey = findMunicipalityDataKey(comunaName, dataKeys);
    
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
 * Gets the range of overpricing percentages across all data
 * @deprecated Use getMunicipalityOverpricingRange() or getRegionOverpricingRange() instead
 */
export function getOverpricingRange(): [number, number] {
  return getMunicipalityOverpricingRange();
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
