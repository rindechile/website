'use client';

import { useState, useEffect } from 'react';
import { ChileMap } from './ChileMap';
import { MapLegend } from './MapLegend';
import { MunicipalityDetail } from './MunicipalityDetail';
import { MapBreadcrumb } from './MapBreadcrumb';
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
        try {
          const regionCode = viewState.selectedRegion.properties.codregion;
          const municipalityCollection = await loadMunicipalitiesGeoJSON(regionCode);
          const enriched = enrichMunicipalityData(municipalityCollection);
          setMunicipalitiesData(enriched);
        } catch (error) {
          console.error('Error loading municipalities for detail:', error);
          setMunicipalitiesData([]);
        }
      } else {
        setMunicipalitiesData([]);
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
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 text-lg font-semibold mb-2">Error</p>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Chile Municipality Overpricing Analysis
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <MapBreadcrumb
              viewState={viewState}
              onNavigateToCountry={handleBackToCountry}
            />
            <div className="h-4 w-px bg-gray-300" />
            <p className="text-sm text-gray-600">
              {viewState.level === 'country'
                ? 'Click on a region to view municipalities'
                : 'Click on a municipality for details'}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-4 p-6">
        {/* Map */}
        <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <ChileMap
            regionsData={regionsData}
            onRegionClick={handleRegionClick}
            onMunicipalityClick={handleMunicipalityClick}
            viewState={viewState}
            colorScale={colorScale}
          />
        </div>

        {/* Legend */}
        <div className="w-64 flex-shrink-0">
          <MapLegend colorScale={colorScale} />
        </div>
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
