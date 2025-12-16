import { useEffect, useRef, RefObject } from 'react';
import * as d3 from 'd3';
import type { TreemapNode, TreemapHierarchy } from '@/types/map';

// Extended type for D3 treemap nodes with layout properties
interface TreemapLayoutNode extends d3.HierarchyNode<TreemapNode> {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface UseTreemapRendererProps {
  svgRef: RefObject<SVGSVGElement | null>;
  data: TreemapHierarchy;
  dimensions: { width: number; height: number };
  onNodeClick: (node: TreemapNode) => void;
  onNodeHover: (tooltipData: {
    name: string;
    value: number;
    overpricingRate: number;
    x: number;
    y: number;
  } | null) => void;
}

export function useTreemapRenderer({
  svgRef,
  data,
  dimensions,
  onNodeClick,
  onNodeHover,
}: UseTreemapRendererProps) {
  // Track the last rendered data to determine if we should animate
  const lastDataRef = useRef<TreemapHierarchy | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || dimensions.width === 0) return;

    // Only animate when data changes, not on resize/scroll
    const shouldAnimate = lastDataRef.current !== data;
    lastDataRef.current = data;

    const { width, height } = dimensions;

    // Create color scale based on purchase value
    const maxValue = d3.max(data.children, d => d.value) || 1;
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolate('oklch(0.5606 0.0047 33.7977)', 'oklch(0.6348 0.229457 33.7977)'));

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

    // Add rectangles - animate only on data change, not resize
    const rects = cells
      .append('rect')
      .attr('fill', d => colorScale(d.data.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('cursor', d => isClickable(d) ? 'pointer' : 'default')
      .attr('tabindex', d => isClickable(d) ? '0' : null)
      .attr('role', d => isClickable(d) ? 'button' : null)
      .attr('aria-label', d => {
        const name = d.data.name;
        const value = d.data.value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
        const rate = (d.data.overpricingRate * 100).toFixed(1);
        return isClickable(d)
          ? `${name}, ${value}, sobreprecio ${rate}%. Presiona Enter para ver más detalles.`
          : `${name}, ${value}, sobreprecio ${rate}%.`;
      })
      .style('transition', 'opacity 0.2s, filter 0.2s')
      .style('outline', 'none');

    if (shouldAnimate) {
      rects
        .attr('width', 0)
        .attr('height', 0)
        .transition()
        .duration(400)
        .ease(d3.easeQuadOut)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0);
    } else {
      rects
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0);
    }

    // Helper function to show hover/focus state
    const showNodeHighlight = (element: Element, d: TreemapLayoutNode) => {
      if (isClickable(d)) {
        d3.select(element)
          .style('opacity', 0.85)
          .style('filter', 'brightness(1.1)');
      }
      const rect = element.getBoundingClientRect();
      onNodeHover({
        name: d.data.name,
        value: d.data.value,
        overpricingRate: d.data.overpricingRate,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    };

    // Helper function to hide hover/focus state
    const hideNodeHighlight = (element: Element) => {
      d3.select(element)
        .style('opacity', 1)
        .style('filter', 'brightness(1)');
      onNodeHover(null);
    };

    // Add event handlers after animation completes
    cells
      .selectAll('rect')
      .on('mouseenter', (event, d) => {
        showNodeHighlight(event.currentTarget, d as TreemapLayoutNode);
      })
      .on('mouseleave', (event) => {
        hideNodeHighlight(event.currentTarget);
      })
      .on('focus', (event, d) => {
        // Add focus ring styling
        d3.select(event.currentTarget)
          .attr('stroke', 'oklch(0.708 0 0)')
          .attr('stroke-width', 3);
        showNodeHighlight(event.currentTarget, d as TreemapLayoutNode);
      })
      .on('blur', (event) => {
        // Remove focus ring styling
        d3.select(event.currentTarget)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);
        hideNodeHighlight(event.currentTarget);
      })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onNodeHover(null);
          if (isClickable(d as TreemapLayoutNode)) {
            onNodeClick((d as TreemapLayoutNode).data);
          }
        }
      })
      .on('click', (event, d) => {
        onNodeHover(null);
        if (isClickable(d as TreemapLayoutNode)) {
          onNodeClick((d as TreemapLayoutNode).data);
        }
      });

    // Add text labels with wrapping
    cells.each(function(d) {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      const name = d.data.name;

      // Only show text if there's enough space
      if (width < 80 || height < 60) return;

      const padding = 8;
      const lineHeight = 14;
      const fontSize = 11;
      const maxWidth = width - padding * 2;

      // Create text element
      const textElement = d3.select(this).append('text')
        .attr('fill', 'currentColor')
        .attr('font-size', `${fontSize}px`)
        .attr('font-weight', '500')
        .attr('pointer-events', 'none')
        .style('opacity', shouldAnimate ? 0 : 1);

      // Helper function to wrap text
      const words = name.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';

      // Create temporary text to measure width
      const tempText = textElement.append('tspan').text('');

      words.forEach((word, i) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        tempText.text(testLine);
        const testWidth = (tempText.node() as SVGTSpanElement).getComputedTextLength();

        if (testWidth > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }

        // Add last line
        if (i === words.length - 1) {
          lines.push(currentLine);
        }
      });

      // Remove temporary text
      tempText.remove();

      // Calculate max lines that fit
      const maxLines = Math.floor((height - padding) / lineHeight);
      const displayLines = lines.slice(0, maxLines);

      // If text is truncated, add ellipsis to last line
      if (lines.length > maxLines && displayLines.length > 0) {
        const lastLineIndex = displayLines.length - 1;
        let lastLine = displayLines[lastLineIndex];

        // Try to fit ellipsis
        const testSpan = textElement.append('tspan').text(lastLine + '...');
        while ((testSpan.node() as SVGTSpanElement).getComputedTextLength() > maxWidth && lastLine.length > 0) {
          lastLine = lastLine.slice(0, -1);
          testSpan.text(lastLine + '...');
        }
        testSpan.remove();

        displayLines[lastLineIndex] = lastLine + '...';
      }

      // Position text at top-left corner
      const yOffset = padding + fontSize;

      // Add tspan elements for each line
      displayLines.forEach((line, i) => {
        textElement.append('tspan')
          .attr('x', padding)
          .attr('y', yOffset + i * lineHeight)
          .text(line);
      });

      // Animate text fade-in only on data change
      if (shouldAnimate) {
        textElement
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
  }, [data, dimensions, onNodeClick, onNodeHover, svgRef]);
}
