import { useEffect, useRef, RefObject } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import type {
  SankeyData,
  SankeyNode,
  SankeyLink,
  SankeyLayoutNode,
  SankeyLayoutLink,
  NodeLegendItem,
} from '@/types/sankey';
import { calculatePercentage } from '@/app/lib/sankey-transform';
import { useViewportSize } from './useViewportSize';

interface UseSankeyRendererProps {
  svgRef: RefObject<SVGSVGElement | null>;
  data: SankeyData;
  dimensions: { width: number; height: number };
  onNodeClick: (node: SankeyLayoutNode) => void;
  onNodesRendered: (nodes: NodeLegendItem[]) => void;
}

// Letters for labeling nodes
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Format currency for accessibility labels
const formatCurrencyLabel = (value: number): string =>
  value.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

export function useSankeyRenderer({
  svgRef,
  data,
  dimensions,
  onNodeClick,
  onNodesRendered,
}: UseSankeyRendererProps) {
  // Track the last rendered data to determine if we should animate
  const lastDataRef = useRef<SankeyData | null>(null);

  // Responsive sizing for touch targets
  const viewportSize = useViewportSize();
  const isMobile = viewportSize === 'mobile';

  useEffect(() => {
    if (!svgRef.current || !data || dimensions.width === 0) return;

    // Only animate when data changes, not on resize/scroll
    const shouldAnimate = lastDataRef.current !== data;
    lastDataRef.current = data;

    const { width, height } = dimensions;

    // Responsive sizing - larger touch targets on mobile
    const nodeWidth = isMobile ? 28 : 18;
    const nodePadding = isMobile ? 20 : 12;
    const letterFontSize = isMobile ? '14px' : '12px';

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Get max value for color scale (excluding source node)
    const targetNodes = data.nodes.filter(n => n.type !== 'source');
    const maxValue = d3.max(targetNodes, d => d.value) || 1;

    // Create color scale based on value (same as treemap)
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolate('oklch(0.652 0.236 320.67)', 'oklch(0.652 0.236 150.67)'));

    // Source node color (neutral/muted)
    const sourceColor = 'oklch(0.5869 0.0025 345.21)';

    // Configure sankey generator with responsive sizing
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeId(d => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([[1, 10], [width - 1, height - 10]]);

    // Create a copy of data to avoid mutating the original
    const sankeyData = {
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d })),
    };

    // Apply sankey layout
    const { nodes, links } = sankeyGenerator(sankeyData) as {
      nodes: SankeyLayoutNode[];
      links: SankeyLayoutLink[];
    };

    // Calculate total value for percentage calculations
    const totalValue = nodes.find(n => n.type === 'source')?.value || 0;

    // Create main group
    const g = svg.append('g');

    // --- Render Links ---
    const linkGroup = g.append('g')
      .attr('class', 'links')
      .attr('role', 'list')
      .attr('aria-label', 'Flujos de presupuesto');

    linkGroup
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', d => {
        const targetColor = colorScale(d.target.value);
        return d3.color(targetColor)?.copy({ opacity: 0.3 })?.toString() || targetColor;
      })
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('role', 'listitem')
      .attr('aria-label', d => {
        const percentage = calculatePercentage(d.value, totalValue).toFixed(1);
        return `Flujo de ${d.source.name} a ${d.target.name}: ${formatCurrencyLabel(d.value)}, ${percentage}% del total`;
      })
      .style('cursor', 'default')
      .style('transition', 'opacity 0.2s, filter 0.2s');

    // Animate links on data change
    if (shouldAnimate) {
      linkGroup.selectAll('path').each(function () {
        const path = d3.select(this);
        const node = this as SVGPathElement;
        const totalLength = node.getTotalLength();
        path
          .attr('stroke-dasharray', totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(400)
          .ease(d3.easeQuadOut)
          .attr('stroke-dashoffset', 0);
      });
    }

    // --- Render Nodes ---
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodeGroups = nodeGroup
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Node rectangles
    const rects = nodeGroups
      .append('rect')
      .attr('fill', d => d.type === 'source' ? sourceColor : colorScale(d.value))
      .attr('height', d => d.y1 - d.y0)
      .attr('cursor', d => d.isClickable ? 'pointer' : 'default')
      .attr('tabindex', d => d.isClickable ? '0' : null)
      .attr('role', d => d.isClickable ? 'button' : null)
      .attr('aria-label', d => {
        const value = formatCurrencyLabel(d.value);
        const percentage = calculatePercentage(d.value, totalValue).toFixed(1);
        const overpricing = d.overpricingRate !== undefined
          ? `, sobreprecio ${(d.overpricingRate * 100).toFixed(1)}%`
          : '';
        return d.isClickable
          ? `${d.name}, ${value}, ${percentage}% del total${overpricing}. Presiona Enter para ver más detalles.`
          : `${d.name}, ${value}, ${percentage}% del total${overpricing}.`;
      })
      .style('transition', 'opacity 0.2s, filter 0.2s');

    // Animate node width on data change
    if (shouldAnimate) {
      rects
        .attr('width', 0)
        .transition()
        .duration(400)
        .ease(d3.easeQuadOut)
        .attr('width', d => d.x1 - d.x0);
    } else {
      rects.attr('width', d => d.x1 - d.x0);
    }

    // Node event handlers (simplified - no hover tooltips)
    rects
      .on('mouseenter', (event, d) => {
        const node = d as SankeyLayoutNode;
        if (node.isClickable) {
          d3.select(event.currentTarget)
            .style('opacity', 0.85)
            .style('filter', 'brightness(1.1)');
        }
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget)
          .style('opacity', 1)
          .style('filter', 'brightness(1)');
      })
      .on('focus', (event, d) => {
        const node = d as SankeyLayoutNode;
        // Use CSS outline for better visibility (works across browsers)
        d3.select(event.currentTarget)
          .style('outline', '3px solid oklch(0.708 0 0)')
          .style('outline-offset', '2px');
        if (node.isClickable) {
          d3.select(event.currentTarget)
            .style('opacity', 0.85)
            .style('filter', 'brightness(1.1)');
        }
      })
      .on('blur', (event) => {
        d3.select(event.currentTarget)
          .style('outline', 'none')
          .style('outline-offset', '0')
          .style('opacity', 1)
          .style('filter', 'brightness(1)');
      })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const node = d as SankeyLayoutNode;
          if (node.isClickable) {
            onNodeClick(node);
          }
        }
      })
      .on('click', (_event, d) => {
        const node = d as SankeyLayoutNode;
        if (node.isClickable) {
          onNodeClick(node);
        }
      });

    // --- Render Letter Labels on Nodes ---
    // Assign letters to target nodes (skip source)
    const targetNodesWithLetters = nodes
      .filter(n => n.type !== 'source')
      .map((node, index) => ({
        node,
        letter: LETTERS[index] || `${index + 1}`,
      }));

    // Create legend data for callback
    const legendItems: NodeLegendItem[] = targetNodesWithLetters.map(({ node, letter }) => ({
      letter,
      name: node.name,
      value: node.value,
      percentage: calculatePercentage(node.value, totalValue),
    }));

    // Call the callback with legend data
    onNodesRendered(legendItems);

    // Render letter labels centered on target nodes
    nodeGroups.each(function (d) {
      const nodeHeight = d.y1 - d.y0;
      const nodeWidth = d.x1 - d.x0;

      // Skip source node
      if (d.type === 'source') return;

      // Find the letter for this node
      const letterData = targetNodesWithLetters.find(t => t.node.id === d.id);
      if (!letterData) return;

      // Render letter centered on the node
      const letterElement = d3.select(this).append('text')
        .attr('fill', 'white')
        .attr('font-size', letterFontSize)
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('x', nodeWidth / 2)
        .attr('y', nodeHeight / 2)
        .attr('aria-hidden', 'true')
        .style('opacity', shouldAnimate ? 0 : 1)
        .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')
        .text(letterData.letter);

      // Animate letter fade-in only on data change
      if (shouldAnimate) {
        letterElement
          .transition()
          .duration(400)
          .delay(200)
          .style('opacity', 1);
      }
    });

    // Cleanup on unmount
    return () => {
      svg.selectAll('*').remove();
    };
  }, [data, dimensions, isMobile, onNodeClick, onNodesRendered, svgRef]);
}
