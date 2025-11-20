import type { ColorScale } from '@/types/map';
import * as d3 from 'd3';

interface MapLegendProps {
  colorScale: ColorScale;
}

export function MapLegend({ colorScale }: MapLegendProps) {
  const { domain, lowColor, highColor } = colorScale;
  
  // Generate gradient stops for smooth color transition
  const gradientStops = Array.from({ length: 100 }, (_, i) => {
    const t = i / 99;
    const color = d3.interpolate(lowColor, highColor)(t);
    return { offset: t * 100, color };
  });

  return (
    <div className="w-full flex items-center gap-6" style={{ backgroundColor: '#121A1D' }}>
      {/* Left label */}
      <div className="text-white text-sm font-light whitespace-nowrap">
        Menor %
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
        Mayor %
      </div>
    </div>
  );
}
