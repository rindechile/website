'use client';

import type { DetailPanelData } from '@/app/contexts/MapContext';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { MetricCard } from '@/app/components/ui/metric-card';
import { TreemapChart } from '@/app/components/map/TreemapChart';
import { TreemapSkeleton } from '@/app/components/map/TreemapSkeleton';
import { getTreemapData } from '@/app/lib/data-service';
import type { TreemapHierarchy } from '@/types/map';
import { useFormatters } from '@/app/lib/hooks/useFormatters';
import { useSeverityLevel } from '@/app/lib/hooks/useSeverityLevel';
import { useAsyncData } from '@/app/lib/hooks/useAsyncData';

interface DetailPanelProps {
  data: DetailPanelData;
}

export function DetailPanel({ data }: DetailPanelProps) {
  const { formatNumber, formatPercentage, formatCurrency } = useFormatters();
  
  // Fetch initial treemap data when detail panel data changes
  const {
    data: treemapData,
    loading: loadingTreemap,
    error: treemapError
  } = useAsyncData<TreemapHierarchy>(
    async () => {
      if (!data) return null;

      if (data.level === 'country') {
        return await getTreemapData('country');
      } else if (data.level === 'region') {
        return await getTreemapData('region', data.regionId);
      } else if (data.level === 'municipality') {
        return await getTreemapData('municipality', data.municipalityId.toString());
      }
      return null;
    },
    [data]
  );

  // Get level and code for TreemapChart props
  const getTreemapProps = () => {
    if (!data) return { level: 'country' as const, code: undefined };

    if (data.level === 'country') {
      return { level: 'country' as const, code: undefined };
    } else if (data.level === 'region') {
      return { level: 'region' as const, code: data.regionId };
    } else {
      return { level: 'municipality' as const, code: data.municipalityId.toString() };
    }
  };

  const severityInfo = useSeverityLevel(data?.data.porcentaje_sobreprecio ?? 0);

  // Empty state when no data
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center rounded-lg border border-border bg-card">
        <div className="text-center px-6 py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona una región en el mapa
          </h3>
          <p className="text-sm text-gray-500">
            Haz clic en el mapa para ver datos detallados de sobreprecio
          </p>
        </div>
      </div>
    );
  }

  // Get title and subtitle based on level
  const getTitle = () => {
    if (data.level === 'country') {
      return data.name;
    }
    if (data.level === 'region') {
      return data.name;
    }
    return data.name; // municipality
  };

  // Create a unique key based on the current selection to trigger animations on change
  const contentKey = data.level === 'country'
    ? 'country'
    : data.level === 'region'
    ? `region-${data.regionId}`
    : `municipality-${data.municipalityId}`;

  return (
    <div className="h-full rounded-lg border border-border flex flex-col">

      {/* Header */}
      <div key={`header-${contentKey}`} className="p-6 animate-fade-in border-b shrink-0">
        <div className="flex items-start justify-between mb-2">

          <h2 className="text-2xl font-semibold">{getTitle()}</h2>

          <Badge variant={severityInfo.variant} className="text-sm hidden shrink-0">
            {severityInfo.level}
          </Badge>
        </div>
      </div>

      {/* Summary Data*/}
      <div key={`summary-${contentKey}`} className="p-6 border-b animate-fade-in-up animate-stagger-1 shrink-0">
        <div className="flex flex-col tablet:flex-row justify-between gap-4">

          <MetricCard
            value={formatPercentage(data.data.porcentaje_sobreprecio)}
            label="Porcentaje de Anomalías"
          />

          <div className='flex flex-col tablet:flex-row gap-4'>
            <MetricCard
              variant="ghost"
              value={data.budget !== null ? formatCurrency(data.budget) : 'No disponible'}
              label= {data.level === 'country' ? 'Gasto Total Nacional' :
                      data.level === 'region' ? 'Gasto Total Regional' :
                      'Gasto Total Municipal'}
            />

            {data.level === 'municipality' && data.budgetPerCapita !== null && (
              <MetricCard
                variant="ghost"
                value={data.budgetPerCapita !== null ? formatCurrency(data.budgetPerCapita) : 'No disponible'}
                label= "Per Cápita"
              />
            )}
          </div>
        </div>
      </div>

      {/* Treemap Visualization */}
      <div key={`treemap-${contentKey}`} className="p-6 flex flex-col animate-fade-in-up animate-stagger-3 flex-1 min-h-0">
        <h3 className="text-md font-medium mb-4">¿Dónde se concentra el sobregasto?</h3>
        <p className="text-xs tablet:text-sm font-light pb-4">Los bloques más grandes indican las categorías con mayor volumen de gasto en compras que pagaron significativamente más que el precio histórico normal.</p>
        <div className="flex-1 min-h-0">
          {loadingTreemap && <TreemapSkeleton />}
          {treemapError && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-destructive mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-destructive">{treemapError}</p>
              </div>
            </div>
          )}
          {!loadingTreemap && !treemapError && treemapData && (
            <TreemapChart
              data={treemapData}
              level={getTreemapProps().level}
              code={getTreemapProps().code}
            />
          )}
          {!loadingTreemap && !treemapError && !treemapData && (
            <div className="text-center h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend and Disclaimer */}
      <div key={`footer-${contentKey}`} className="p-6 border-t animate-fade-in-up animate-stagger-4 flex flex-row justify-between shrink-0">
        <div className='flex flex-col gap-4'>
          <h4 className=''>Porcentaje de compras con sobreprecio</h4>
          <div className='flex flex-row gap-4'>

            <div className='flex flex-col gap-2'>
              <p className='text-xs'>Bajo</p>
              <div className='h-4 w-32 rounded-xs bg-foreground'></div>
            </div>

            <div className='flex flex-col gap-2'>
              <p className='text-xs'>Medio</p>
              <div className='h-4 w-32 rounded-xs bg-muted'></div>
            </div>

            <div className='flex flex-col gap-2'>
              <p className='text-xs'>Alto</p>
              <div className='h-4 w-32 rounded-xs bg-secondary'></div>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-4'>
          <h4 className=''>Disclaimer</h4>
          <p className='text-xs'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
        </div>
      </div>

    </div>
  );
}
