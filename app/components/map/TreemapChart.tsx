'use client';

import { useEffect, useRef, useState } from 'react';
import type { TreemapHierarchy } from '@/types/map';
import { useTreemapNavigation } from './hooks/useTreemapNavigation';
import { useTreemapRenderer } from './hooks/useTreemapRenderer';
import { useResponsiveDimensions } from './hooks/useResponsiveDimensions';
import { TreemapBreadcrumbs } from './TreemapBreadcrumbs';
import { TreemapTooltip } from './TreemapTooltip';
import { TreemapLegend } from './TreemapLegend';
import { Loading } from '@/app/components/ui/loading';

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

  // Dismiss tooltip when clicking outside the treemap container (mobile fix)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setTooltipData(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card rounded-lg">
            <Loading size="md" text="Cargando..." />
          </div>
        )}
        <svg
          ref={svgRef}
          className="w-full rounded-lg bg-card border border-border"
          style={{ height: dimensions.height || 200 }}
        />

        {/* Tooltip */}
        <TreemapTooltip data={tooltipData} />
      </div>
    </div>
  );
}
