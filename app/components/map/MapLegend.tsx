import type { ColorScale } from '@/types/map';
import * as d3 from 'd3';
import { Badge } from '@/components/ui/badge';

interface MapLegendProps {
  colorScale: ColorScale;
  showStatistics?: boolean;
  nationalAverage?: number;
}

export function MapLegend({ colorScale, showStatistics = true, nationalAverage }: MapLegendProps) {
  const { domain, lowColor, highColor } = colorScale;
  
  // Generate gradient stops for smooth color transition
  const gradientStops = Array.from({ length: 100 }, (_, i) => {
    const t = i / 99;
    const color = d3.interpolate(lowColor, highColor)(t);
    return { offset: t * 100, color };
  });

  return (
    <div className="w-full space-y-3" style={{ backgroundColor: '#121A1D' }}>
      {/* Legend Title and Stats */}
      <div className="flex items-center justify-between">
        <div className="text-white/70 text-xs font-light">
          Porcentaje de compras con sobreprecio
        </div>
        {showStatistics && nationalAverage !== undefined && (
          <Badge variant="outline" className="bg-white/5 text-white/80 border-white/20">
            Promedio nacional: {nationalAverage.toFixed(2)}%
          </Badge>
        )}
      </div>

      {/* Gradient Bar */}
      <div className="flex items-center gap-6">
        {/* Left label */}
        <div className="text-white text-sm font-light whitespace-nowrap">
          {domain[0].toFixed(1)}%
        </div>
        
        {/* Color gradient bar */}
        <div className="flex-1 relative">
          <svg width="100%" height="12" className="rounded-sm">
            <defs>
              <linearGradient id="overpricing-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {gradientStops.map((stop, i) => (
                  <stop
                    key={i}
                    offset={`${stop.offset}%`}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
            </defs>
            <rect
              width="100%"
              height="12"
              fill="url(#overpricing-gradient)"
              rx="2"
            />
          </svg>
        </div>

        {/* Right label */}
        <div className="text-white text-sm font-light whitespace-nowrap">
          {domain[1].toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
