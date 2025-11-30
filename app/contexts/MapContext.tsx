'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  EnrichedRegionData,
  EnrichedMunicipalityData,
  MapViewState,
  RegionData,
  MunicipalityData,
} from '@/types/map';
import {
  loadRegionsGeoJSON,
  enrichRegionData,
  getRegionOverpricingRange,
  loadMunicipalitiesGeoJSON,
  enrichMunicipalityData,
  getCountryData,
  getRegionDataByCode,
} from '@/app/lib/data-service';
import { useMapNavigation } from '@/app/components/map/hooks/useMapNavigation';
import { useAriaLive } from '@/app/components/map/hooks/useAriaLive';

export type DetailPanelData =
  | {
      level: 'country';
      name: string;
      data: {
        porcentaje_sobreprecio: number;
        compras_caras: number;
        compras_totales: number;
      };
    }
  | {
      level: 'region';
      name: string;
      regionId: string;
      data: RegionData;
    }
  | {
      level: 'municipality';
      name: string;
      regionName: string;
      municipalityId: number;
      data: MunicipalityData;
    }
  | null;

interface MapContextValue {
  // Data
  regionsData: EnrichedRegionData[];
  municipalitiesData: EnrichedMunicipalityData[];
  nationalAverage: number | undefined;

  // View state
  viewState: MapViewState;
  detailPanelData: DetailPanelData;

  // Loading states
  loading: boolean;
  loadingMunicipalities: boolean;
  error: string | null;

  // Handlers
  handleRegionClick: (regionCode: string) => void;
  handleMunicipalityClick: (municipalityCode: string) => void;
  handleMunicipalitySelectById: (municipalityId: number, regionCode: number) => void;
  handleBackToCountry: () => void;
  handleRetry: () => void;

  // Accessibility
  ariaLiveMessage: string;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ 
  children,
  initialRegionCode,
}: { 
  children: ReactNode;
  initialRegionCode?: number;
}) {
  const [regionsData, setRegionsData] = useState<EnrichedRegionData[]>([]);
  const [municipalitiesData, setMunicipalitiesData] = useState<EnrichedMunicipalityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nationalAverage, setNationalAverage] = useState<number | undefined>(undefined);

  // Accessibility
  const { message: ariaLiveMessage, announce } = useAriaLive();

  // Navigation
  const {
    viewState,
    selectedMunicipalityData,
    handleRegionClick,
    handleMunicipalityClick,
    handleMunicipalitySelectById,
    handleBackToCountry,
  } = useMapNavigation({
    regionsData,
    municipalitiesData,
    onAnnounce: announce,
    initialRegionCode,
  });

  // Load initial region data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const regionsGeoJSON = await loadRegionsGeoJSON();
        const enriched = enrichRegionData(regionsGeoJSON);

        // Calculate national average
        const totalOverpricing = enriched.reduce(
          (sum, region) => sum + region.averageOverpricing,
          0
        );
        const average = enriched.length > 0 ? totalOverpricing / enriched.length : undefined;
        setNationalAverage(average);

        setRegionsData(enriched);
      } catch (err) {
        console.error('Error loading map data:', err);
        setError('Failed to load map data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Load municipalities when region is selected
  useEffect(() => {
    async function loadMunicipalities() {
      if (viewState.level === 'region' && viewState.selectedRegion) {
        setLoadingMunicipalities(true);
        try {
          const regionCode = viewState.selectedRegion.properties.codregion;
          const municipalityCollection = await loadMunicipalitiesGeoJSON(regionCode);
          const enriched = enrichMunicipalityData(municipalityCollection);
          setMunicipalitiesData(enriched);
        } catch (error) {
          console.error('Error loading municipalities:', error);
          setMunicipalitiesData([]);
        } finally {
          setLoadingMunicipalities(false);
        }
      } else {
        setMunicipalitiesData([]);
        setLoadingMunicipalities(false);
      }
    }

    loadMunicipalities();
  }, [viewState.level, viewState.selectedRegion]);

  // Calculate detail panel data based on view state
  const detailPanelData: DetailPanelData = (() => {
    if (viewState.level === 'country') {
      const countryData = getCountryData();
      return {
        level: 'country',
        name: 'Chile',
        data: countryData,
      };
    }
    
    if (viewState.level === 'region' && viewState.selectedRegion) {
      const regionCode = viewState.selectedRegion.properties.codregion;
      const regionData = getRegionDataByCode(regionCode);
      const regionName = viewState.selectedRegion.properties.Region;
      
      // If municipality is selected, show municipality data
      if (viewState.selectedMunicipality && selectedMunicipalityData?.data) {
        return {
          level: 'municipality',
          name: selectedMunicipalityData.name,
          regionName: selectedMunicipalityData.regionName,
          municipalityId: selectedMunicipalityData.municipalityId,
          data: selectedMunicipalityData.data,
        };
      }
      
      // Otherwise show region data
      if (regionData) {
        return {
          level: 'region',
          name: regionName,
          regionId: regionCode.toString(),
          data: regionData,
        };
      }
    }
    
    return null;
  })();

  const handleRetry = () => {
    window.location.reload();
  };

  const value: MapContextValue = {
    regionsData,
    municipalitiesData,
    nationalAverage,
    viewState,
    detailPanelData,
    loading,
    loadingMunicipalities,
    error,
    handleRegionClick,
    handleMunicipalityClick,
    handleMunicipalitySelectById,
    handleBackToCountry,
    handleRetry,
    ariaLiveMessage,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}
