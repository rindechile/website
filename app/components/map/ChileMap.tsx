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
import { useTooltip } from './hooks/useTooltip';

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
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

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
      const padding = 100;
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
      scale = 700;
      rotate = [71, 37, 0];
    } else if (viewportSize === 'tablet') {
      scale = 750;
      rotate = [71, 37, 0];
    } else {
      scale = 800;
      rotate = [71, 37, 0];
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
            regionsData.map((region) => (
              <path
                key={region.feature.properties.codregion}
                d={pathGenerator(region.feature) || ''}
                fill={getFill(region.averageOverpricing)}
                stroke="#101010"
                strokeWidth={0.9}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleRegionClick(region.feature.properties.codregion.toString())}
                onMouseEnter={(e) =>
                  showTooltip(
                    {
                      name: region.feature.properties.Region,
                      overpricing: region.averageOverpricing,
                    },
                    e
                  )
                }
                onMouseLeave={hideTooltip}
              />
            ))}

          {/* Render municipalities when in region view */}
          {viewState.level === 'region' && !loadingMunicipalities &&
            municipalitiesData.map((municipality) => (
              <path
                key={municipality.feature.properties.cod_comuna}
                d={pathGenerator(municipality.feature) || ''}
                fill={getFill(municipality.data?.porcentaje_sobreprecio)}
                stroke="#101010"
                strokeWidth={1.1}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMunicipalityClick(municipality.feature.properties.cod_comuna.toString())}
                onMouseEnter={(e) =>
                  showTooltip(
                    {
                      name: municipality.feature.properties.Comuna,
                      overpricing: municipality.data?.porcentaje_sobreprecio || null,
                    },
                    e
                  )
                }
                onMouseLeave={hideTooltip}
              />
            ))}

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

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-gray-900 text-white px-3 py-2 rounded shadow-lg text-sm z-50"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
          }}
        >
          <div className="font-semibold">{tooltip.name}</div>
          {tooltip.overpricing !== null && tooltip.overpricing !== undefined ? (
            <div>Overpricing: {tooltip.overpricing.toFixed(2)}%</div>
          ) : (
            <div className="text-gray-400">No data</div>
          )}
        </div>
      )}
    </div>
  );
}
