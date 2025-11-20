import type { ColorScale } from '@/types/map';
import * as d3 from 'd3';

interface MapLegendProps {
  colorScale: ColorScale;
  title?: string;
}

export function MapLegend({ colorScale, title = 'Overpricing %' }: MapLegendProps) {
  const { domain, lowColor, highColor } = colorScale;
  
  // Generate gradient stops for smooth color transition
  const gradientStops = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    const value = domain[0] + t * (domain[1] - domain[0]);
    const color = d3.interpolate(lowColor, highColor)(t);
    return { offset: t * 100, color, value };
  });

  // Generate tick marks
  const ticks = [domain[0], (domain[0] + domain[1]) / 2, domain[1]];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      
      {/* Color gradient bar */}
      <div className="relative">
        <svg width="100%" height="20" className="rounded">
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
            height="20"
            fill="url(#overpricing-gradient)"
            rx="4"
          />
        </svg>

        {/* Tick marks and labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {ticks.map((tick, i) => (
            <span key={i} className="font-medium">
              {tick.toFixed(1)}%
            </span>
          ))}
        </div>
      </div>

      {/* No data indicator */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
        <div className="w-4 h-4 bg-gray-200 rounded border border-gray-300" />
        <span className="text-xs text-gray-600">No data</span>
      </div>
    </div>
  );
}
