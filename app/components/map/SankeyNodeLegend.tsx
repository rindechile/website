import { useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import { useFormatters } from '@/app/lib/hooks/useFormatters';
import type { NodeLegendItem } from '@/types/sankey';

interface SankeyNodeLegendProps {
  nodes: NodeLegendItem[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function SankeyNodeLegend({ nodes, isExpanded, onToggle }: SankeyNodeLegendProps) {
  const { formatCurrency } = useFormatters();
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll into view when expanded
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      // Small delay to allow animation to start
      const timeout = setTimeout(() => {
        contentRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isExpanded]);

  if (nodes.length === 0) return null;

  const lastLetter = nodes[nodes.length - 1]?.letter || 'Z';

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle} className="mt-4">
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-expanded={isExpanded}
          aria-controls="sankey-legend-content"
        >
          <span>Ver leyenda (A-{lastLetter})</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2" id="sankey-legend-content">
        <div
          ref={contentRef}
          className="rounded-lg border border-border bg-card overflow-hidden"
          role="region"
          aria-label="Lista de categorías del diagrama"
        >
          <ul role="list" className="max-h-64 overflow-y-auto divide-y divide-border">
            {nodes.map((node) => (
              <li
                key={node.letter}
                role="listitem"
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted/30 transition-colors"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary shrink-0"
                  aria-hidden="true"
                >
                  {node.letter}
                </span>
                <span className="flex-1 text-sm truncate" title={node.name}>
                  {node.name}
                </span>
                <span className="text-sm font-medium tabular-nums shrink-0" aria-label={`Monto: ${formatCurrency(node.value)}`}>
                  {formatCurrency(node.value)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-12 text-right" aria-label={`${node.percentage.toFixed(1)} por ciento del total`}>
                  {node.percentage.toFixed(1)}%
                </span>
                {/* Screen reader summary */}
                <span className="sr-only">
                  {node.letter}: {node.name}, {formatCurrency(node.value)}, {node.percentage.toFixed(1)}% del total
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
