'use client';

import { useEffect, useRef, useState } from 'react';
import type { TreemapHierarchy } from '@/types/map';
import { useTreemapNavigation } from './hooks/useTreemapNavigation';
import { useTreemapRenderer } from './hooks/useTreemapRenderer';
import { useResponsiveDimensions } from './hooks/useResponsiveDimensions';
import { TreemapBreadcrumbs } from './TreemapBreadcrumbs';
import { TreemapTooltip } from './TreemapTooltip';
import { TreemapLegend } from './TreemapLegend';

interface TreemapChartProps {
  data: TreemapHierarchy;
  level: 'country' | 'region' | 'municipality';
  code?: string;
}

export function TreemapChart({ data: initialData, level, code }: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<{
    name: string;
    value: number;
    overpricingRate: number;
    x: number;
    y: number;
  } | null>(null);

  // Custom hooks for navigation and rendering
  const {
    data,
    breadcrumbs,
    loading,
    handleDrillDown,
    handleBreadcrumbClick,
    resetNavigation,
  } = useTreemapNavigation({ initialData, level, code });

  const dimensions = useResponsiveDimensions(containerRef);

  // Reset data when initialData changes (e.g., user selects different region)
  useEffect(() => {
    resetNavigation(initialData);
  }, [initialData, resetNavigation]);

  // Render treemap visualization
  useTreemapRenderer({
    svgRef,
    data,
    dimensions,
    onNodeClick: handleDrillDown,
    onNodeHover: setTooltipData,
  });

  return (
    <div className="relative">
      {/* Breadcrumb Navigation */}
      <TreemapBreadcrumbs
        breadcrumbs={breadcrumbs}
        loading={loading}
        onBreadcrumbClick={handleBreadcrumbClick}
      />

      {/* SVG Treemap */}
      <div ref={containerRef} className="relative w-full">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
            </div>
          </div>
        )}
        <svg
          ref={svgRef}
          className="w-full rounded-lg bg-background border border-border"
          style={{ height: dimensions.height || 400 }}
        />

        {/* Tooltip */}
        <TreemapTooltip data={tooltipData} />
      </div>

      {/* Legend */}
      <TreemapLegend breadcrumbsLength={breadcrumbs.length} />
    </div>
  );
}
