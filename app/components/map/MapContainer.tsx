'use client';

import { useEffect } from 'react';
import { ChileMap } from './ChileMap';
import { MapLegend } from './MapLegend';
import { MapLoadingState } from './MapLoadingState';
import { MapErrorState } from './MapErrorState';
import { useMapContext } from '@/app/contexts/MapContext';
import { useColorScale } from './hooks/useColorScale';
import {
  getMunicipalityOverpricingRange,
  getRegionOverpricingRange,
  getMunicipalityTertileBreakpoints,
  getRegionTertileBreakpoints,
} from '@/app/lib/data-service';

export function MapContainer() {
  const {
    regionsData,
    municipalitiesData,
    loadingMunicipalities,
    nationalAverage,
    viewState,
    handleRegionClick,
    handleMunicipalityClick,
    handleBackToCountry,
    loading,
    error,
    handleRetry,
  } = useMapContext();

  // Use custom hook for color scale management
  const colorScale = useColorScale({
    viewLevel: viewState.level,
    getRegionRange: getRegionOverpricingRange,
    getRegionTertiles: getRegionTertileBreakpoints,
    getMunicipalityRange: getMunicipalityOverpricingRange,
    getMunicipalityTertiles: getMunicipalityTertileBreakpoints,
  });

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
    <div className="w-full py-8 tablet:w-2/5 flex flex-col bg-secondary rounded-xl border border-border">
      {/* Header */}
      <div className="px-8">
        <h2 className="text-xl font-semibold">
          Compras Anómalas en Chile
        </h2>
      </div>

      {/* Main Content: Map */}
      <div className="flex-1 overflow-hidden my-8">
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
      </div>

      {/* Legend */}
      <div className="px-8">
        <MapLegend colorScale={colorScale} nationalAverage={nationalAverage} />
      </div>
    </div>
  );
}
