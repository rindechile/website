'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TreemapNode, TreemapHierarchy } from '@/types/map';
import { useFormatters } from '@/app/lib/hooks/useFormatters';

interface TreemapChartProps {
  data: TreemapHierarchy;
  width?: number;
  height?: number;
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

const MIN_RECT_SIZE = 24; // Minimum rectangle size in pixels

export function TreemapChart({ data, width = 800, height = 500 }: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentNode, setCurrentNode] = useState<TreemapNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: data.name }]);
  const [tooltipData, setTooltipData] = useState<{
    name: string;
    value: number;
    overpricingRate: number;
    x: number;
    y: number;
  } | null>(null);
  
  const { formatCurrency, formatPercentage } = useFormatters();

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Get CSS color variables
    const styles = getComputedStyle(document.documentElement);
    const colorBajo = styles.getPropertyValue('--map-tier-bajo').trim();
    const colorMedio = styles.getPropertyValue('--map-tier-medio').trim();
    const colorAlto = styles.getPropertyValue('--map-tier-alto').trim();

    // Create color scale based on purchase value
    const maxValue = d3.max(data.children, d => d.value) || 1;
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolateBlues);

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
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    const treemap = d3
      .treemap<TreemapNode>()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(4)
      .round(true);

    treemap(root);

    // Filter nodes by minimum size and aggregate "Others"
    const leaves = root.leaves() as TreemapLayoutNode[];
    const visibleLeaves: TreemapLayoutNode[] = [];
    let othersValue = 0;
    let othersCount = 0;
    let othersExpensive = 0;
    let othersPurchases = 0;

    for (const leaf of leaves) {
      const nodeWidth = leaf.x1 - leaf.x0;
      const nodeHeight = leaf.y1 - leaf.y0;

      if (nodeWidth >= MIN_RECT_SIZE && nodeHeight >= MIN_RECT_SIZE) {
        visibleLeaves.push(leaf);
      } else {
        othersValue += leaf.value || 0;
        othersCount++;
        // Approximate expensive purchases for aggregation
        const purchases = 1; // Each leaf represents aggregated data
        othersPurchases += purchases;
        othersExpensive += purchases * (leaf.data.overpricingRate / 100);
      }
    }

    // Create group for rectangles
    const g = svg.append('g');

    // Render visible nodes
    const cells = g
      .selectAll('g')
      .data(visibleLeaves)
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

    // Add "Others" rectangle if there are small items
    if (othersCount > 0) {
      const othersOverpricingRate = othersPurchases > 0 
        ? (othersExpensive / othersPurchases) * 100 
        : 0;

      // Position "Others" in bottom-right corner
      const othersWidth = 120;
      const othersHeight = 60;
      const othersX = width - othersWidth - 4;
      const othersY = height - othersHeight - 4;

      const othersGroup = g
        .append('g')
        .attr('transform', `translate(${othersX},${othersY})`);

      othersGroup
        .append('rect')
        .attr('width', othersWidth)
        .attr('height', othersHeight)
        .attr('fill', colorScale(othersValue))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,2')
        .attr('opacity', 0.8);

      othersGroup
        .append('text')
        .attr('x', othersWidth / 2)
        .attr('y', othersHeight / 2 - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(`Others (${othersCount})`);

      othersGroup
        .append('text')
        .attr('x', othersWidth / 2)
        .attr('y', othersHeight / 2 + 8)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('font-size', '9px')
        .text(formatCurrency(othersValue));
    }
  }, [data, currentNode, width, height]);

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
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="rounded-lg bg-background border border-border"
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
          <div className="h-4 w-8 rounded" style={{ background: 'linear-gradient(to right, #deebf7, #08519c)' }} />
          <span>Low → High</span>
        </div>
      </div>
    </div>
  );
}
