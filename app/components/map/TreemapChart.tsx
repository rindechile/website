'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { TreemapNode, TreemapHierarchy } from '@/types/map';
import { useFormatters } from '@/app/lib/hooks/useFormatters';
import { getTreemapData } from '@/app/lib/data-service';

interface TreemapChartProps {
  data: TreemapHierarchy;
  level: 'country' | 'region' | 'municipality';
  code?: string;
}

interface BreadcrumbItem {
  name: string;
  categoryId?: number;
  segmentId?: number;
  familyId?: number;
}

// Extended type for D3 treemap nodes with layout properties
interface TreemapLayoutNode extends d3.HierarchyNode<TreemapNode> {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function TreemapChart({ data: initialData, level, code }: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TreemapHierarchy>(initialData);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: initialData.name }]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    name: string;
    value: number;
    overpricingRate: number;
    x: number;
    y: number;
  } | null>(null);

  const { formatCurrency } = useFormatters();

  // Reset data when initialData changes (e.g., user selects different region)
  useEffect(() => {
    setData(initialData);
    setBreadcrumbs([{ name: initialData.name }]);
  }, [initialData]);

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

  // Handle drilling down into a node
  const handleDrillDown = useCallback(async (node: TreemapNode) => {
    setLoading(true);
    try {
      let newData: TreemapHierarchy | null = null;

      if (node.type === 'category') {
        // Drill down to segments
        newData = await getTreemapData(level, code, node.id);
        if (newData) {
          setBreadcrumbs(prev => [...prev, { name: node.name, categoryId: node.id }]);
        }
      } else if (node.type === 'segment') {
        // Drill down to families
        const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        newData = await getTreemapData(level, code, currentBreadcrumb.categoryId, node.id);
        if (newData) {
          setBreadcrumbs(prev => [...prev, {
            name: node.name,
            categoryId: currentBreadcrumb.categoryId,
            segmentId: node.id
          }]);
        }
      } else if (node.type === 'family') {
        // Drill down to classes
        const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        newData = await getTreemapData(
          level,
          code,
          currentBreadcrumb.categoryId,
          currentBreadcrumb.segmentId,
          node.id
        );
        if (newData) {
          setBreadcrumbs(prev => [...prev, {
            name: node.name,
            categoryId: currentBreadcrumb.categoryId,
            segmentId: currentBreadcrumb.segmentId,
            familyId: node.id
          }]);
        }
      }

      if (newData) {
        setData(newData);
      }
    } catch (error) {
      console.error('Failed to drill down:', error);
    } finally {
      setLoading(false);
    }
  }, [level, code, breadcrumbs]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback(async (index: number) => {
    if (index === breadcrumbs.length - 1) return; // Already at this level

    setLoading(true);
    try {
      const breadcrumb = breadcrumbs[index];
      let newData: TreemapHierarchy | null = null;

      if (index === 0) {
        // Go back to categories view
        newData = await getTreemapData(level, code);
      } else if (breadcrumb.familyId !== undefined) {
        // Go to classes view
        newData = await getTreemapData(
          level,
          code,
          breadcrumb.categoryId,
          breadcrumb.segmentId,
          breadcrumb.familyId
        );
      } else if (breadcrumb.segmentId !== undefined) {
        // Go to families view
        newData = await getTreemapData(level, code, breadcrumb.categoryId, breadcrumb.segmentId);
      } else if (breadcrumb.categoryId !== undefined) {
        // Go to segments view
        newData = await getTreemapData(level, code, breadcrumb.categoryId);
      }

      if (newData) {
        setData(newData);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      }
    } catch (error) {
      console.error('Failed to navigate:', error);
    } finally {
      setLoading(false);
    }
  }, [breadcrumbs, level, code]);

  // Render treemap visualization
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

    // Create root node with children
    const rootNode: TreemapNode = {
      id: 0,
      name: data.name,
      value: d3.sum(data.children, d => d.value),
      overpricingRate: 0,
      children: data.children,
      type: 'category',
    };

    // Create hierarchy
    const root = d3
      .hierarchy<TreemapNode>(rootNode)
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

    // Determine if cells are clickable (categories, segments, and families are clickable)
    const isClickable = (d: TreemapLayoutNode) =>
      d.data.type === 'category' || d.data.type === 'segment' || d.data.type === 'family';

    // Add rectangles
    cells
      .append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => colorScale(d.data.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('cursor', d => isClickable(d) ? 'pointer' : 'default')
      .style('transition', 'opacity 0.2s')
      .on('mouseenter', (event, d) => {
        if (isClickable(d)) {
          d3.select(event.currentTarget).style('opacity', 0.8);
        }
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipData({
          name: d.data.name,
          value: d.data.value,
          overpricingRate: d.data.overpricingRate,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('opacity', 1);
        setTooltipData(null);
      })
      .on('click', (event, d) => {
        if (isClickable(d)) {
          handleDrillDown(d.data);
        }
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
  }, [data, dimensions, handleDrillDown]);

  // Get helper text based on current level
  const getHelperText = () => {
    if (breadcrumbs.length === 1) {
      return 'Click a category to view segments';
    } else if (breadcrumbs.length === 2) {
      return 'Click a segment to view families';
    } else if (breadcrumbs.length === 3) {
      return 'Click a family to view classes';
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Breadcrumb Navigation */}
      <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
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
              disabled={index === breadcrumbs.length - 1 || loading}
            >
              {breadcrumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* SVG Treemap */}
      <div ref={containerRef} className="relative w-full">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
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
      <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
        <span className="text-muted-foreground">Purchase Amount:</span>
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 rounded" style={{ background: 'linear-gradient(to right, oklch(0.652 0.236 332.23), oklch(0.652 0.236 138.18))' }} />
          <span>Low → High</span>
        </div>
        {getHelperText() && (
          <span className="text-muted-foreground ml-4">{getHelperText()}</span>
        )}
      </div>
    </div>
  );
}
