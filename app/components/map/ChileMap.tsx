'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  onRegionClick?: (regionCode: string) => void;
  onMunicipalityClick?: (municipalityCode: string) => void;
  viewState: MapViewState;
  colorScale: ColorScale;
}

export function ChileMap({
  regionsData,
  onRegionClick,
  onMunicipalityClick,
  viewState,
  colorScale,
}: ChileMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

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

  // Setup D3 projection centered on Chile
  const projection = d3
    .geoMercator()
    .center([-71, -35]) // Center on Chile
    .scale(viewState.level === 'country' ? 800 : 2000) // Adjust scale based on view level
    .translate([dimensions.width / 2, dimensions.height / 2]);

  const pathGenerator = d3.geoPath().projection(projection);

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
        className="bg-white"
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

          {/* Placeholder for municipality rendering - will be implemented in step 7 */}
          {viewState.level === 'region' && viewState.selectedRegion && (
            <text x={dimensions.width / 2} y={dimensions.height / 2} textAnchor="middle">
              Municipality view - coming in step 7
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
