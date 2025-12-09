'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import type {
  MapViewState,
  EnrichedRegionData,
  EnrichedMunicipalityData,
  ColorScale,
} from '@/types/map';
import { useViewportSize } from './hooks/useViewportSize';

interface ChileMapProps {
  regionsData: EnrichedRegionData[];
  municipalitiesData: EnrichedMunicipalityData[];
  loadingMunicipalities: boolean;
  onRegionClick?: (regionCode: string) => void;
  onMunicipalityClick?: (municipalityCode: string) => void;
  viewState: MapViewState;
  colorScale: ColorScale;
}

export function ChileMap({
  regionsData,
  municipalitiesData,
  loadingMunicipalities,
  onRegionClick,
  onMunicipalityClick,
  viewState,
  colorScale,
}: ChileMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  
  // Use custom hooks
  const viewportSize = useViewportSize();

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Setup D3 projection centered on Chile or selected region
  const projection = useCallback(() => {
    const baseProjection = d3.geoMercator();
    
    if (viewState.level === 'region' && viewState.selectedRegion && municipalitiesData.length > 0) {
      // Use D3's fitExtent to automatically calculate correct projection parameters
      const padding = 20;
      return baseProjection
        .rotate([0, 0, 0]) // Reset rotation for region view
        .fitExtent(
          [[padding, padding], [dimensions.width - padding, dimensions.height - padding]], 
          viewState.selectedRegion
        );
    }
    
    // Default: center on Chile with breakpoint-specific values
    let scale: number;
    let rotate: [number, number, number];
    
    if (viewportSize === 'mobile') {
      scale = 800;
      rotate = [70.5, 37, 0];
    } else if (viewportSize === 'tablet') {
      scale = 1000;
      rotate = [70.5, 37, 90];
    } else {
      scale = 1500;
      rotate = [70.5, 37, 90];
    }
    
    return baseProjection
      .rotate(rotate)
      .center([0, 0])
      .scale(scale)
      .translate([dimensions.width / 2, dimensions.height / 2]);
  }, [viewState.level, viewState.selectedRegion, dimensions, municipalitiesData, viewportSize]);

  // Create path generator with reactive projection updates
  const pathGenerator = useMemo(
    () => d3.geoPath().projection(projection()),
    [projection]
  );

  // Get fill for area (texture URL or color)
  const getFill = useCallback(
    (overpricing: number | null | undefined): string => {
      if (overpricing === null || overpricing === undefined) {
        return '#E5E7EB'; // Gray for no data
      }
      
      // Find the appropriate tier based on threshold
      for (let i = colorScale.breakpoints.length - 1; i >= 0; i--) {
        if (overpricing >= colorScale.breakpoints[i].threshold) {
          // Return texture URL if available, otherwise return color
          return colorScale.breakpoints[i].texture || colorScale.breakpoints[i].color;
        }
      }
      
      // Default to first tier if below all thresholds
      return colorScale.breakpoints[0]?.texture || colorScale.breakpoints[0]?.color || '#E5E7EB';
    },
    [colorScale]
  );

  // Handle region click
  const handleRegionClick = useCallback(
    (regionCode: string) => {
      if (onRegionClick && viewState.level === 'country') {
        onRegionClick(regionCode);
      }
    },
    [onRegionClick, viewState.level]
  );

  // Handle municipality click
  const handleMunicipalityClick = useCallback(
    (municipalityCode: string) => {
      if (onMunicipalityClick && viewState.level === 'region') {
        onMunicipalityClick(municipalityCode);
      }
    },
    [onMunicipalityClick, viewState.level]
  );

  // Get CSS variable values from document
  const styles = getComputedStyle(document.documentElement);
  const colorStroke = styles.getPropertyValue('--color-secondary').trim();

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
      >
        <g className="map-container">
          {/* Render regions when in country view */}
          {viewState.level === 'country' &&
            regionsData.map((region) => {
              const regionCode = region.feature.properties.codregion.toString();
              const regionName = region.feature.properties.Region || `Región ${regionCode}`;
              const overpricing = region.averageOverpricing;
              const overpricingText = overpricing !== null && overpricing !== undefined
                ? `sobreprecio promedio ${(overpricing * 100).toFixed(1)}%`
                : 'sin datos';

              return (
                <path
                  key={regionCode}
                  d={pathGenerator(region.feature) || ''}
                  fill={getFill(overpricing)}
                  stroke={colorStroke}
                  strokeWidth={0.6}
                  className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:stroke-[1.2px] focus:outline-none focus:stroke-[2px] focus:opacity-80"
                  style={{ outline: 'none' }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${regionName}, ${overpricingText}. Presiona Enter para ver municipalidades.`}
                  onClick={() => handleRegionClick(regionCode)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRegionClick(regionCode);
                    }
                  }}
                />
              );
            })}

          {/* Render municipalities when in region view */}
          {viewState.level === 'region' && !loadingMunicipalities &&
            municipalitiesData.map((municipality) => {
              const municipalityCode = municipality.feature.properties.cod_comuna.toString();
              const municipalityName = municipality.feature.properties.Comuna || `Comuna ${municipalityCode}`;
              const overpricing = municipality.data?.porcentaje_sobreprecio;
              const overpricingText = overpricing !== null && overpricing !== undefined
                ? `sobreprecio ${(overpricing * 100).toFixed(1)}%`
                : 'sin datos';

              return (
                <path
                  key={municipalityCode}
                  d={pathGenerator(municipality.feature) || ''}
                  fill={getFill(overpricing)}
                  stroke={colorStroke}
                  strokeWidth={0.9}
                  className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:stroke-[1.4px] focus:outline-none focus:stroke-[2px] focus:opacity-80"
                  style={{ outline: 'none' }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${municipalityName}, ${overpricingText}. Presiona Enter para ver detalles.`}
                  onClick={() => handleMunicipalityClick(municipalityCode)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMunicipalityClick(municipalityCode);
                    }
                  }}
                />
              );
            })}

          {/* Loading indicator for municipalities */}
          {viewState.level === 'region' && loadingMunicipalities && (
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2}
              textAnchor="middle"
              className="text-sm fill-gray-600"
            >
              Loading municipalities...
            </text>
          )}
        </g>
      </svg>

    </div>
  );
}
