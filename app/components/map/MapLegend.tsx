import type { ColorScale } from '@/types/map';
import { Badge } from '@/app/components/ui/badge';

interface MapLegendProps {
  colorScale: ColorScale;
  showStatistics?: boolean;
  nationalAverage?: number;
}

export function MapLegend({ colorScale, showStatistics = true, nationalAverage }: MapLegendProps) {
  const { breakpoints, domain } = colorScale;
  const maxValue = domain[1];
  
  return (
    <div className="w-full space-y-3">
      
      {/* Legend Title */}
      <div className="text-xs">
        Porcentaje de compras con sobreprecio
      </div>

      {/* Discrete tier segments */}
      <div className="flex items-center gap-4">
        {breakpoints.map((breakpoint, index) => {
          const nextThreshold = breakpoints[index + 1]?.threshold || maxValue;
          
          return (
            <div key={breakpoint.label} className="flex-1 flex flex-col gap-1">
              {/* Texture/Color preview */}
              {breakpoint.texture ? (
                <svg width="100%" height="20" className="rounded-sm">
                  <rect 
                    x="0" 
                    y="0" 
                    width="100%" 
                    height="100%" 
                    fill={breakpoint.texture} 
                    stroke="#101010"
                    strokeWidth="0.5"
                  />
                </svg>
              ) : (
                <div 
                  className="h-5 rounded-sm"
                  style={{ backgroundColor: breakpoint.color }}
                />
              )}
              {/* Label and range */}
              <div className="text-xs font-light text-center">
                <div className="font-medium">{breakpoint.label}</div>
                <div className="text-secondary-foreground ">
                  {breakpoint.threshold}%-{nextThreshold}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      {showStatistics && nationalAverage !== undefined && (
          <Badge variant="outline" className="w-full bg-white/5 border-white/20">
            <p className="font-medium">Promedio nacional:</p> {nationalAverage.toFixed(2)}%
          </Badge>
        )}
    </div>
  );
}
