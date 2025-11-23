'use client';

import { useState, useEffect } from 'react';
import { ChileMap } from './ChileMap';
import { MapLegend } from './MapLegend';
import { MunicipalityPanel } from './MunicipalityPanel';
import { MapLoadingState } from './MapLoadingState';
import { MapErrorState } from './MapErrorState';
import { Button } from '@/app/components/ui/button';

import type {
  EnrichedRegionData,
  EnrichedMunicipalityData,
  ColorScale,
} from '@/types/map';
import {
  loadRegionsGeoJSON,
  enrichRegionData,
  getMunicipalityOverpricingRange,
  getRegionOverpricingRange,
  loadMunicipalitiesGeoJSON,
  enrichMunicipalityData,
  getMunicipalityTertileBreakpoints,
  getRegionTertileBreakpoints,
} from '@/app/lib/data-service';
import { useAriaLive } from './hooks/useAriaLive';
import { useMapNavigation } from './hooks/useMapNavigation';

export function MapContainer() {
  const [regionsData, setRegionsData] = useState<EnrichedRegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [municipalitiesData, setMunicipalitiesData] = useState<EnrichedMunicipalityData[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [nationalAverage, setNationalAverage] = useState<number | undefined>(undefined);
  const [shareButtonText, setShareButtonText] = useState<'share' | 'copied'>('share');

  // Accessibility announcements
  const { message: ariaLiveMessage, announce } = useAriaLive();

  // Navigation state and handlers
  const {
    viewState,
    selectedMunicipalityData, 
    handleRegionClick,
    handleMunicipalityClick,
    handleBackToCountry,
  } = useMapNavigation({
    regionsData,
    municipalitiesData,
    onAnnounce: announce,
  });

  // Initialize color scale
  const [colorScale, setColorScale] = useState<ColorScale>({
    domain: [0, 100],
    breakpoints: [],
  });

  // Initialize breakpoints with CSS variables on mount
  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Get tertile breakpoints from region data (for initial country view)
    const tertiles = getRegionTertileBreakpoints();
    
    const breakpoints = [
      { threshold: tertiles[0], color: computedStyle.getPropertyValue('--tier-bajo').trim(), label: 'Bajo' },
      { threshold: tertiles[1], color: computedStyle.getPropertyValue('--tier-medio').trim(), label: 'Medio' },
      { threshold: tertiles[2], color: computedStyle.getPropertyValue('--tier-alto').trim(), label: 'Alto' },
    ];
    
    setColorScale((prev) => ({
      ...prev,
      breakpoints,
    }));
  }, []);

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

        // Calculate national average
        const totalOverpricing = enriched.reduce(
          (sum, region) => sum + region.averageOverpricing,
          0
        );
        const average = enriched.length > 0 ? totalOverpricing / enriched.length : undefined;
        setNationalAverage(average);

        setRegionsData(enriched);
        setColorScale((prev) => ({
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
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    if (viewState.level === 'country') {
      // Use region range and tertiles for country view
      const range = getRegionOverpricingRange();
      const tertiles = getRegionTertileBreakpoints();
      
      const breakpoints = [
        { threshold: tertiles[0], color: computedStyle.getPropertyValue('--tier-bajo').trim(), label: 'Bajo' },
        { threshold: tertiles[1], color: computedStyle.getPropertyValue('--tier-medio').trim(), label: 'Medio' },
        { threshold: tertiles[2], color: computedStyle.getPropertyValue('--tier-alto').trim(), label: 'Alto' },
      ];
      
      setColorScale({
        domain: range,
        breakpoints,
      });
    } else if (viewState.level === 'region') {
      // Use municipality range and tertiles for region view
      const range = getMunicipalityOverpricingRange();
      const tertiles = getMunicipalityTertileBreakpoints();
      
      const breakpoints = [
        { threshold: tertiles[0], color: computedStyle.getPropertyValue('--tier-bajo').trim(), label: 'Bajo' },
        { threshold: tertiles[1], color: computedStyle.getPropertyValue('--tier-medio').trim(), label: 'Medio' },
        { threshold: tertiles[2], color: computedStyle.getPropertyValue('--tier-alto').trim(), label: 'Alto' },
      ];
      
      setColorScale({
        domain: range,
        breakpoints,
      });
    }
  }, [viewState.level]);

  // Handle retry for errors
  const handleRetry = () => {
    window.location.reload();
  };

  // Handle share button
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareButtonText('copied');
      setTimeout(() => setShareButtonText('share'), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key to go back
      if (event.key === 'Escape') {
        if (viewState.level === 'region') {
          handleBackToCountry();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState.level, handleBackToCountry]);

  if (loading) {
    return <MapLoadingState />;
  }

  if (error) {
    return <MapErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="w-2/5 flex flex-col">

      {/* Main Content: Map + Panel Grid */}
      <div className="flex-1 overflow-hidden">
        {viewState.level === 'country' ? (
          // Country view: Just the map
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
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
        ) : (
          // Region view: Map + Municipality Panel (responsive grid)
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
            {/* Map Section */}
            <div className="flex flex-col min-h-0">
              <div className="flex-1 overflow-hidden">
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

            {/* Municipality Detail Panel */}
            <div className="min-h-0 lg:h-full">
              <MunicipalityPanel
                municipalityName={selectedMunicipalityData?.name || null}
                regionName={selectedMunicipalityData?.regionName || null}
                data={selectedMunicipalityData?.data || null}
              />
            </div>
          </div>
        )}
      </div>

      {/* Legend at Bottom */}
      <div className="px-8 pb-8">
        <MapLegend colorScale={colorScale} nationalAverage={nationalAverage} />
      </div>

      {/* ARIA Live Region for Screen Reader Announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {ariaLiveMessage}
      </div>
    </div>
  );
}
