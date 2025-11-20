import type {
  MunicipalityDataMap,
  RegionFeatureCollection,
  MunicipalityFeatureCollection,
  EnrichedRegionData,
  EnrichedMunicipalityData,
} from '@/types/map';
import { findMunicipalityDataKey } from './name-normalizer';
import municipalityData from '@/app/data/data_municipalities.json';

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
 * Calculates aggregate overpricing data for a region
 */
export async function calculateRegionOverpricing(
  regionCode: number
): Promise<{
  averageOverpricing: number;
  municipalityCount: number;
  totalExpensivePurchases: number;
  totalPurchases: number;
}> {
  try {
    const municipalityCollection = await loadMunicipalitiesGeoJSON(regionCode);
    const enrichedData = enrichMunicipalityData(municipalityCollection);
    
    let totalOverpricing = 0;
    let countWithData = 0;
    let totalExpensivePurchases = 0;
    let totalPurchases = 0;

    enrichedData.forEach(({ data }) => {
      if (data) {
        totalOverpricing += data.porcentaje_sobreprecio;
        totalExpensivePurchases += data.compras_caras;
        totalPurchases += data.compras_totales;
        countWithData++;
      }
    });

    return {
      averageOverpricing: countWithData > 0 ? totalOverpricing / countWithData : 0,
      municipalityCount: enrichedData.length,
      totalExpensivePurchases,
      totalPurchases,
    };
  } catch (error) {
    console.error(`Error calculating region ${regionCode} overpricing:`, error);
    return {
      averageOverpricing: 0,
      municipalityCount: 0,
      totalExpensivePurchases: 0,
      totalPurchases: 0,
    };
  }
}

/**
 * Enriches all regions with aggregated overpricing data
 */
export async function enrichRegionData(
  regionCollection: RegionFeatureCollection
): Promise<EnrichedRegionData[]> {
  const enrichmentPromises = regionCollection.features.map(async feature => {
    const stats = await calculateRegionOverpricing(feature.properties.codregion);
    
    return {
      feature,
      averageOverpricing: stats.averageOverpricing,
      municipalityCount: stats.municipalityCount,
      totalExpensivePurchases: stats.totalExpensivePurchases,
      totalPurchases: stats.totalPurchases,
    };
  });

  return Promise.all(enrichmentPromises);
}

/**
 * Gets the range of overpricing percentages across all data
 */
export function getOverpricingRange(): [number, number] {
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
