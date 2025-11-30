import { useFormatters } from '@/app/lib/hooks/useFormatters';

interface TreemapTooltipProps {
  data: {
    name: string;
    value: number;
    overpricingRate: number;
    x: number;
    y: number;
  } | null;
}

export function TreemapTooltip({ data }: TreemapTooltipProps) {
  const { formatCurrency } = useFormatters();

  if (!data) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-border bg-background px-3 py-2 shadow-lg"
      style={{
        left: `${data.x}px`,
        top: `${data.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="text-sm font-medium">{data.name}</div>
      <div className="text-xs text-muted-foreground">
        {formatCurrency(data.value)}
      </div>
    </div>
  );
}
