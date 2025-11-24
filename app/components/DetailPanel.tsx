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
import { Card } from '@/app/components/ui/card';

interface DetailPanelProps {
  data: DetailPanelData;
}

// Helper function to get severity level and badge variant
function getSeverityInfo(percentage: number): {
  level: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
} {
  if (percentage <= 12) {
    return { level: 'Bajo', variant: 'secondary', color: 'text-yellow-600' };
  } else if (percentage <= 18) {
    return { level: 'Medio', variant: 'outline', color: 'text-pink-600' };
  } else {
    return { level: 'Alto', variant: 'destructive', color: 'text-red-600' };
  }
}

export function DetailPanel({ data }: DetailPanelProps) {
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const severityInfo = getSeverityInfo(data.data.porcentaje_sobreprecio);

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

      {/* D3 Chart Placeholder */}
      <div className="rounded-lg border border-border p-6 mb-6 bg-muted/20">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            D3 Chart Placeholder
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Visualizations coming soon
          </p>
        </div>
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
