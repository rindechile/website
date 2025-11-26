'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TreemapNode, TreemapHierarchy } from '@/types/map';
import { useFormatters } from '@/app/lib/hooks/useFormatters';

interface TreemapChartProps {
  data: TreemapHierarchy;
}

interface BreadcrumbItem {
  name: string;
  node?: TreemapNode;
}

// Extended type for D3 treemap nodes with layout properties
interface TreemapLayoutNode extends d3.HierarchyNode<TreemapNode> {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function TreemapChart({ data }: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentNode, setCurrentNode] = useState<TreemapNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: data.name }]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltipData, setTooltipData] = useState<{
    name: string;
    value: number;
    overpricingRate: number;
    x: number;
    y: number;
  } | null>(null);
  
  const { formatCurrency, formatPercentage } = useFormatters();

  // Update dimensions on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Responsive height based on screen size
        const height = window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 350 : 400;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || dimensions.width === 0) return;

    const { width, height } = dimensions;

    // Create color scale based on purchase value
    const maxValue = d3.max(data.children, d => d.value) || 1;
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolate('oklch(0.652 0.236 332.23)', 'oklch(0.652 0.236 138.18)'));

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Determine which data to display
    const displayData = currentNode || {
      id: 'root',
      name: data.name,
      value: d3.sum(data.children, d => d.value),
      overpricingRate: 0,
      children: data.children,
      type: 'segment' as const,
    };

    // Create hierarchy
    const root = d3
      .hierarchy<TreemapNode>(displayData)
      .sum(d => d.children ? 0 : d.value) // Only sum leaf nodes
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    const treemap = d3
      .treemap<TreemapNode>()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(2)
      .round(true);

    treemap(root);

    // Get all leaves
    const leaves = root.leaves() as TreemapLayoutNode[];

    // Create group for rectangles
    const g = svg.append('g');

    // Render all nodes
    const cells = g
      .selectAll('g')
      .data(leaves)
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    cells
      .append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => colorScale(d.data.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('cursor', 'default')
      .on('mouseenter', (event, d) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipData({
          name: d.data.name,
          value: d.data.value,
          overpricingRate: d.data.overpricingRate,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      })
      .on('mouseleave', () => {
        setTooltipData(null);
      });

    // Add text labels
    cells
      .append('text')
      .attr('x', 4)
      .attr('y', 16)
      .attr('fill', 'currentColor')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text(d => {
        const width = d.x1 - d.x0;
        const name = d.data.name;
        // Only show text if there's enough space
        if (width < 60) return '';
        // Truncate long names
        return name.length > 20 ? name.substring(0, 17) + '...' : name;
      });
  }, [data, currentNode, dimensions]);

  const handleDrillDown = (node: TreemapNode) => {
    setCurrentNode(node);
    setBreadcrumbs(prev => [...prev, { name: node.name, node }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setCurrentNode(null);
      setBreadcrumbs([{ name: data.name }]);
    } else {
      const breadcrumb = breadcrumbs[index];
      setCurrentNode(breadcrumb.node || null);
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    }
  };

  return (
    <div className="relative">
      {/* Breadcrumb Navigation */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={`${
                index === breadcrumbs.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              } transition-colors`}
              disabled={index === breadcrumbs.length - 1}
            >
              {breadcrumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* SVG Treemap */}
      <div ref={containerRef} className="relative w-full">
        <svg
          ref={svgRef}
          className="w-full rounded-lg bg-background border border-border"
          style={{ height: dimensions.height || 400 }}
        />

        {/* Tooltip */}
        {tooltipData && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border border-border bg-background px-3 py-2 shadow-lg"
            style={{
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="text-sm font-medium">{tooltipData.name}</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(tooltipData.value)}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <span className="text-muted-foreground">Purchase Amount:</span>
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 rounded" style={{ background: 'linear-gradient(to right, oklch(0.652 0.236 332.23), oklch(0.652 0.236 138.18))' }} />
          <span>Low → High</span>
        </div>
      </div>
    </div>
  );
}
