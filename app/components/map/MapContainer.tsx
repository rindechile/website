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
    <div className="w-full py-8 flex flex-col bg-secondary rounded-xl border border-border">
      {/* Header */}
      <div className="px-8">
        <h2 className="text-xl tablet:text-2xl pb-2 font-semibold">
          ¿Dónde están las compras públicas que merecen atención?
        </h2>
        <p className="text-xs text-secondary-foreground tablet:text-sm font-medium tablet:max-w-[35rem] desktop:max-w-[38rem]">Descúbre dónde se concentran las compras que superan significativamente el rango histórico de precio. Explora a nivel nacional, regional y municipal.</p>
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
        <MapLegend colorScale={colorScale} />
      </div>
    </div>
  );
}
