'use client';

import { useState, useEffect } from 'react';
import { ChileMap } from './ChileMap';
import { MapLegend } from './MapLegend';
import { MunicipalityDetail } from './MunicipalityDetail';
import { Logo } from '../Logo';
import type {
  MapViewState,
  EnrichedRegionData,
  EnrichedMunicipalityData,
  ColorScale,
  MunicipalityData,
} from '@/types/map';
import {
  loadRegionsGeoJSON,
  enrichRegionData,
  getMunicipalityOverpricingRange,
  getRegionOverpricingRange,
  loadMunicipalitiesGeoJSON,
  enrichMunicipalityData,
} from '@/app/lib/data-service';

export function MapContainer() {
  const [regionsData, setRegionsData] = useState<EnrichedRegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>({
    level: 'country',
    selectedRegion: null,
    selectedMunicipality: null,
  });
  const [selectedMunicipalityData, setSelectedMunicipalityData] = useState<{
    name: string;
    regionName: string;
    data: MunicipalityData | null;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [municipalitiesData, setMunicipalitiesData] = useState<EnrichedMunicipalityData[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  // Initialize color scale
  const [colorScale, setColorScale] = useState<ColorScale>({
    domain: [0, 100],
    lowColor: '#68CCDB',
    highColor: '#ED2472',
    interpolate: (t: number) => '',
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Load regions GeoJSON
        const regionsGeoJSON = await loadRegionsGeoJSON();

        // Enrich with pre-computed overpricing data (synchronous now)
        const enriched = enrichRegionData(regionsGeoJSON);

        // Get region overpricing range for color scale (used in country view)
        const range = getRegionOverpricingRange();

        setRegionsData(enriched);
        setColorScale(prev => ({
          ...prev,
          domain: range,
        }));
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
          console.error('Error loading municipalities for detail:', error);
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

  // Update color scale range based on view level
  useEffect(() => {
    if (viewState.level === 'country') {
      // Use region range for country view
      const range = getRegionOverpricingRange();
      setColorScale(prev => ({
        ...prev,
        domain: range,
      }));
    } else if (viewState.level === 'region') {
      // Use municipality range for region view
      const range = getMunicipalityOverpricingRange();
      setColorScale(prev => ({
        ...prev,
        domain: range,
      }));
    }
  }, [viewState.level]);

  // Handle region click
  const handleRegionClick = (regionCode: string) => {
    const region = regionsData.find(
      r => r.feature.properties.codregion.toString() === regionCode
    );

    if (region) {
      setViewState({
        level: 'region',
        selectedRegion: region.feature,
        selectedMunicipality: null,
      });
    }
  };

  // Handle municipality click
  const handleMunicipalityClick = (municipalityCode: string) => {
    const municipality = municipalitiesData.find(
      m => m.feature.properties.cod_comuna.toString() === municipalityCode
    );

    if (municipality) {
      setSelectedMunicipalityData({
        name: municipality.feature.properties.Comuna,
        regionName: viewState.selectedRegion?.properties.Region || '',
        data: municipality.data,
      });
      setDialogOpen(true);
    }
  };

  // Handle back navigation
  const handleBackToCountry = () => {
    setViewState({
      level: 'country',
      selectedRegion: null,
      selectedMunicipality: null,
    });
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#121A1D' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-white">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#121A1D' }}>
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg font-semibold mb-2">Error</p>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col" style={{ backgroundColor: '#121A1D' }}>
      {/* Header */}
      <header className="px-8 py-6" style={{ backgroundColor: '#121A1D' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-semibold text-white">
              Sobreprecios en Chile
            </h1>
          </div>
          <div className="text-white font-light">
            Transparenta 2025
          </div>
        </div>
      </header>

      {/* Main Title */}
      <div className="px-8 py-4 text-center">
        <h2 className="text-2xl font-light text-white">
          % de compras con sobreprecio por región en 2025
        </h2>
      </div>

      {/* Map Container */}
      <div className="flex-1 px-8 pb-2 overflow-hidden">
        <div className="w-full h-full" style={{ backgroundColor: '#121A1D' }}>
          <ChileMap
            regionsData={regionsData}
            municipalitiesData={municipalitiesData}
            loadingMunicipalities={loadingMunicipalities}
            onRegionClick={handleRegionClick}
            onMunicipalityClick={handleMunicipalityClick}
            viewState={viewState}
            colorScale={colorScale}
          />
        </div>
      </div>

      {/* Legend at Bottom */}
      <div className="px-8 pb-8">
        <MapLegend colorScale={colorScale} />
      </div>

      {/* Municipality Detail Dialog */}
      {selectedMunicipalityData && (
        <MunicipalityDetail
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          municipalityName={selectedMunicipalityData.name}
          regionName={selectedMunicipalityData.regionName}
          data={selectedMunicipalityData.data}
        />
      )}
    </div>
  );
}
