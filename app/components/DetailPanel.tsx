'use client';

import type { DetailPanelData } from '@/app/contexts/MapContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { TreemapChart } from '@/app/components/map/TreemapChart';
import { getTreemapData } from '@/app/lib/data-service';
import type { TreemapHierarchy } from '@/types/map';
import { useFormatters } from '@/app/lib/hooks/useFormatters';
import { useSeverityLevel } from '@/app/lib/hooks/useSeverityLevel';
import { useAsyncData } from '@/app/lib/hooks/useAsyncData';

interface DetailPanelProps {
  data: DetailPanelData;
}

export function DetailPanel({ data }: DetailPanelProps) {
  const { formatNumber, formatPercentage } = useFormatters();
  
  // Fetch treemap data when detail panel data changes
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
            Select a region or municipality
          </h3>
          <p className="text-sm text-gray-500">
            Click on the map to view detailed overpricing data
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

  const getSubtitle = () => {
    if (data.level === 'country') {
      return 'Vista Nacional';
    }
    if (data.level === 'region') {
      return 'Vista Regional';
    }
    return data.regionName; // municipality shows region name
  };

  return (
    <div className="h-full overflow-y-auto rounded-xl bg-card p-8 border border-border">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{getTitle()}</h2>
            <p className="text-sm text-muted-foreground mt-1">{getSubtitle()}</p>
          </div>
          <Badge variant={severityInfo.variant} className="text-sm ml-4 shrink-0">
            {severityInfo.level}
          </Badge>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-lg p-6 border border-border mb-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Overpricing Percentage</p>
          <p className="text-4xl font-bold">
            {formatPercentage(data.data.porcentaje_sobreprecio)}
          </p>
        </div>
      </div>

      {/* Treemap Visualization */}
      <div className="rounded-lg border border-border p-6 mb-6">
        <h3 className="text-sm font-medium mb-4">Purchase Distribution by Category</h3>
        {loadingTreemap && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">Loading visualization...</p>
            </div>
          </div>
        )}
        {treemapError && (
          <div className="flex items-center justify-center py-12">
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
          <TreemapChart data={treemapData} width={700} height={400} />
        )}
        {!loadingTreemap && !treemapError && !treemapData && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="rounded-lg border border-border mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/3">Metric</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Overpriced Purchases</TableCell>
              <TableCell className="text-right font-mono">
                {formatNumber(data.data.compras_caras)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Total Purchases</TableCell>
              <TableCell className="text-right font-mono">
                {formatNumber(data.data.compras_totales)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Overpricing Rate</TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {formatPercentage(data.data.porcentaje_sobreprecio)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ratio</TableCell>
              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                {data.data.compras_caras} / {data.data.compras_totales}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center">
        Data represents the percentage of purchases with overpricing issues
      </p>
    </div>
  );
}
