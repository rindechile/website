// Municipality data from data_municipalities.json
export interface MunicipalityData {
  porcentaje_sobreprecio: number;
  compras_caras: number;
  compras_totales: number;
}

// Map of municipality names to their data
export type MunicipalityDataMap = Record<string, MunicipalityData>;

// Pre-computed region data from data_regions.json
export interface RegionData {
  porcentaje_sobreprecio: number;
  compras_caras: number;
  compras_totales: number;
}

// Map of region names to their pre-computed data
export type RegionDataMap = Record<string, RegionData>;

// GeoJSON base types - using GeoJSON standard types for D3 compatibility
import type { Geometry } from 'geojson';

// Common properties in both region and municipality GeoJSON
interface BaseGeoJSONProperties {
  objectid: number;
  codregion: number;
  Region: string;
  st_area_sh: number;
  st_length_: number;
}

// Region-specific properties
export interface RegionProperties extends BaseGeoJSONProperties {
  cir_sena: number;
  area_km: number;
}

// Municipality-specific properties
export interface MunicipalityProperties extends BaseGeoJSONProperties {
  shape_leng: number;
  dis_elec: number;
  cir_sena: number;
  cod_comuna: number;
  Comuna: string;
  Provincia: string;
}

// GeoJSON Feature types
export interface RegionFeature {
  type: "Feature";
  geometry: Geometry;
  properties: RegionProperties;
}

export interface MunicipalityFeature {
  type: "Feature";
  geometry: Geometry;
  properties: MunicipalityProperties;
}

// GeoJSON FeatureCollection types
export interface RegionFeatureCollection {
  type: "FeatureCollection";
  features: RegionFeature[];
}

export interface MunicipalityFeatureCollection {
  type: "FeatureCollection";
  name?: string;
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: MunicipalityFeature[];
}

// Enriched data types (GeoJSON + overpricing data)
export interface EnrichedRegionData {
  feature: RegionFeature;
  averageOverpricing: number;
  municipalityCount?: number; // Optional since not available in pre-computed data
  totalExpensivePurchases: number;
  totalPurchases: number;
}

export interface EnrichedMunicipalityData {
  feature: MunicipalityFeature;
  data: MunicipalityData | null;
  normalizedName: string;
}

// View state types
export type ViewLevel = "country" | "region" | "municipality";

export interface MapViewState {
  level: ViewLevel;
  selectedRegion: RegionFeature | null;
  selectedMunicipality: MunicipalityFeature | null;
}

// Color scale types
export interface ColorScale {
  domain: [number, number];
  lowColor: string;
  highColor: string;
  interpolate: (t: number) => string;
}

// Tooltip data
export interface TooltipData {
  name: string;
  overpricing: number | null;
  x: number;
  y: number;
}
