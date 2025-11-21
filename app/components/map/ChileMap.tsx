'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import type {
  MapViewState,
  EnrichedRegionData,
  EnrichedMunicipalityData,
  TooltipData,
  ColorScale,
} from '@/types/map';

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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size (below md breakpoint: 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    
    // Default: center on Chile with rotation on desktop
    const rotation = isMobile ? 0 : 90; // Rotate 90° on desktop, 0° on mobile
    return baseProjection
      .rotate([0, 0, rotation])
      .center([-71, -35])
      .scale(800)
      .translate([dimensions.width / 2, dimensions.height / 2]);
  }, [viewState.level, viewState.selectedRegion, dimensions, municipalitiesData, isMobile]);

  // Create path generator with reactive projection updates
  const pathGenerator = useMemo(
    () => d3.geoPath().projection(projection()),
    [projection]
  );

  // Color scale function
  const getColor = useCallback(
    (overpricing: number | null | undefined): string => {
      if (overpricing === null || overpricing === undefined) {
        return '#E5E7EB'; // Gray for no data
      }
      return d3.interpolate(colorScale.lowColor, colorScale.highColor)(
        (overpricing - colorScale.domain[0]) / (colorScale.domain[1] - colorScale.domain[0])
      );
    },
    [colorScale]
  );

  // Setup zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('g.map-container');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Reset zoom when view state changes
    if (viewState.level === 'country') {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }

    return () => {
      svg.on('.zoom', null);
    };
  }, [viewState.level]);

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

  // Show tooltip
  const showTooltip = useCallback((data: TooltipData, event: React.MouseEvent) => {
    setTooltip({
      ...data,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ backgroundColor: '#121A1D' }}
      >
        <g className="map-container">
          {/* Render regions when in country view */}
          {viewState.level === 'country' &&
            regionsData.map((region) => (
              <path
                key={region.feature.properties.codregion}
                d={pathGenerator(region.feature) || ''}
                fill={getColor(region.averageOverpricing)}
                stroke="#FFFFFF"
                strokeWidth={1}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleRegionClick(region.feature.properties.codregion.toString())}
                onMouseEnter={(e) =>
                  showTooltip(
                    {
                      name: region.feature.properties.Region,
                      overpricing: region.averageOverpricing,
                      x: 0,
                      y: 0,
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
                fill={getColor(municipality.data?.porcentaje_sobreprecio)}
                stroke="#FFFFFF"
                strokeWidth={0.5}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMunicipalityClick(municipality.feature.properties.cod_comuna.toString())}
                onMouseEnter={(e) =>
                  showTooltip(
                    {
                      name: municipality.feature.properties.Comuna,
                      overpricing: municipality.data?.porcentaje_sobreprecio || null,
                      x: 0,
                      y: 0,
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
