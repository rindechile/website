'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSlugFromCode, getCodeFromSlug } from '@/lib/region-slugs';
import type {
  MapViewState,
  EnrichedRegionData,
  EnrichedMunicipalityData,
  MunicipalityData,
} from '@/types/map';

interface SelectedMunicipalityData {
  name: string;
  regionName: string;
  municipalityId: number;
  data: MunicipalityData | null;
}

interface UseMapNavigationProps {
  regionsData: EnrichedRegionData[];
  municipalitiesData: EnrichedMunicipalityData[];
  onAnnounce: (message: string) => void;
  initialRegionCode?: number;
}

export function useMapNavigation({
  regionsData,
  municipalitiesData,
  onAnnounce,
  initialRegionCode,
}: UseMapNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [viewState, setViewState] = useState<MapViewState>({
    level: 'country',
    selectedRegion: null,
    selectedMunicipality: null,
  });

  const [selectedMunicipalityData, setSelectedMunicipalityData] =
    useState<SelectedMunicipalityData | null>(null);

  const [pendingMunicipalityId, setPendingMunicipalityId] = useState<number | null>(null);

  // Initialize view from URL or initialRegionCode
  useEffect(() => {
    if (regionsData.length === 0) return;

    // Try to get region code from URL pathname first
    let regionCode: number | null = null;
    
    if (pathname !== '/') {
      const slug = pathname.replace('/', '');
      regionCode = getCodeFromSlug(slug);
    }
    
    // Fallback to initialRegionCode prop if no valid slug in URL
    if (!regionCode && initialRegionCode) {
      regionCode = initialRegionCode;
    }

    if (regionCode && viewState.level === 'country') {
      const region = regionsData.find(
        (r) => r.feature.properties.codregion === regionCode
      );

      if (region) {
        setViewState({
          level: 'region',
          selectedRegion: region.feature,
          selectedMunicipality: null,
        });
      }
    }
  }, [pathname, regionsData, viewState.level, initialRegionCode]);

  const handleRegionClick = (regionCode: string) => {
    const region = regionsData.find(
      (r) => r.feature.properties.codregion.toString() === regionCode
    );

    if (region) {
      setViewState({
        level: 'region',
        selectedRegion: region.feature,
        selectedMunicipality: null,
      });

      // Clear selected municipality data
      setSelectedMunicipalityData(null);

      // Update URL with slug
      const slug = getSlugFromCode(Number(regionCode));
      if (slug) {
        router.push(`/${slug}`, { scroll: false });
      }

      // Announce to screen readers
      onAnnounce(`Mostrando región ${region.feature.properties.Region}`);
    }
  };

  const handleMunicipalityClick = (municipalityCode: string) => {
    const municipality = municipalitiesData.find(
      (m) => m.feature.properties.cod_comuna.toString() === municipalityCode
    );

    if (municipality) {
      // Update viewState with selected municipality
      setViewState((prev) => ({
        ...prev,
        selectedMunicipality: municipality.feature,
      }));

      // Update municipality data for the panel
      setSelectedMunicipalityData({
        name: municipality.feature.properties.Comuna,
        regionName: viewState.selectedRegion?.properties.Region || '',
        municipalityId: municipality.feature.properties.cod_comuna,
        data: municipality.data,
      });

      // Announce to screen readers
      onAnnounce(`Mostrando detalles de ${municipality.feature.properties.Comuna}`);
    }
  };

  const handleBackToCountry = () => {
    setViewState({
      level: 'country',
      selectedRegion: null,
      selectedMunicipality: null,
    });

    // Clear selected municipality data
    setSelectedMunicipalityData(null);

    // Clear URL params
    router.push('/', { scroll: false });

    // Announce to screen readers
    onAnnounce('Mostrando vista de Chile completo');
  };

  const handleMunicipalitySelectById = (municipalityId: number, regionCode: number) => {
    // First, ensure we're viewing the correct region
    const region = regionsData.find(
      (r) => r.feature.properties.codregion === regionCode
    );

    if (region) {
      setViewState({
        level: 'region',
        selectedRegion: region.feature,
        selectedMunicipality: null,
      });

      // Update URL with slug
      const slug = getSlugFromCode(regionCode);
      if (slug) {
        router.push(`/${slug}`, { scroll: false });
      }

      // Store pending municipality ID to select after municipalities load
      setPendingMunicipalityId(municipalityId);

      // Announce to screen readers
      onAnnounce(`Mostrando región ${region.feature.properties.Region}`);
    }
  };

  // Auto-select municipality after region change if we have a pending selection
  useEffect(() => {
    if (municipalitiesData.length > 0 && viewState.level === 'region') {
      // Check for pending municipality ID (from search or programmatic selection)
      let municipalityIdToSelect = pendingMunicipalityId;

      // Check sessionStorage for municipality ID from search dialog
      if (!municipalityIdToSelect && typeof window !== 'undefined') {
        const storedId = sessionStorage.getItem('selectedMunicipalityId');
        if (storedId) {
          municipalityIdToSelect = parseInt(storedId, 10);
          sessionStorage.removeItem('selectedMunicipalityId');
        }
      }

      if (municipalityIdToSelect) {
        const municipality = municipalitiesData.find(
          (m) => m.feature.properties.cod_comuna === municipalityIdToSelect
        );

        if (municipality) {
          // Update viewState with selected municipality
          setViewState((prev) => ({
            ...prev,
            selectedMunicipality: municipality.feature,
          }));

          // Update municipality data for the panel
          setSelectedMunicipalityData({
            name: municipality.feature.properties.Comuna,
            regionName: viewState.selectedRegion?.properties.Region || '',
            municipalityId: municipality.feature.properties.cod_comuna,
            data: municipality.data,
          });

          // Announce to screen readers
          onAnnounce(`Mostrando detalles de ${municipality.feature.properties.Comuna}`);

          // Clear pending selection
          setPendingMunicipalityId(null);
        } else {
          // Fallback for municipalities not in GeoJSON (e.g., islands)
          const fetchMunicipalityFromAPI = async () => {
            try {
              const response = await fetch(`/api/municipalities/${municipalityIdToSelect}`);
              if (!response.ok) {
                throw new Error('Failed to fetch municipality');
              }
              const data = (await response.json()) as {
                id: number;
                name: string;
                region_id: number;
                region_name: string;
                budget: number | null;
                budget_per_capita: number | null;
                porcentaje_sobreprecio: number;
                compras_caras: number;
                compras_totales: number;
              };

              // Update municipality data for the panel (no geometry to highlight)
              setSelectedMunicipalityData({
                name: data.name,
                regionName: data.region_name,
                municipalityId: data.id,
                data: {
                  porcentaje_sobreprecio: data.porcentaje_sobreprecio,
                  compras_caras: data.compras_caras,
                  compras_totales: data.compras_totales,
                  budget: data.budget,
                  budget_per_capita: data.budget_per_capita,
                },
              });

              // Announce to screen readers
              onAnnounce(`Mostrando detalles de ${data.name}`);

              // Clear pending selection
              setPendingMunicipalityId(null);
            } catch (error) {
              console.error('Error fetching municipality data:', error);
              setPendingMunicipalityId(null);
            }
          };

          fetchMunicipalityFromAPI();
        }
      }
    }
  }, [municipalitiesData, pendingMunicipalityId, viewState.level, viewState.selectedRegion, onAnnounce]);

  return {
    viewState,
    selectedMunicipalityData,
    handleRegionClick,
    handleMunicipalityClick,
    handleMunicipalitySelectById,
    handleBackToCountry,
  };
}
