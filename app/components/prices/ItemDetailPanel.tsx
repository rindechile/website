'use client';

import { MetricCard } from '@/app/components/ui/metric-card';
import { Badge } from '@/app/components/ui/badge';
import { ItemCategoryBreadcrumb } from './ItemCategoryBreadcrumb';
import { useFormatters } from '@/app/lib/hooks/useFormatters';
import type { ItemDetail, ItemSupplier, ItemRegionStats } from '@/types/items';

interface ItemDetailPanelProps {
  item: ItemDetail;
  suppliers: ItemSupplier[];
  regions: ItemRegionStats[];
}

export function ItemDetailPanel({ item, suppliers, regions }: ItemDetailPanelProps) {
  const { formatCurrency, formatPercentage, formatNumber } = useFormatters();

  const priceRangeDisplay = item.expectedMinRange !== null && item.expectedMaxRange !== null
    ? `${formatCurrency(item.expectedMinRange)} - ${formatCurrency(item.expectedMaxRange)}`
    : 'No disponible';

  return (
    <div className="h-full rounded-lg border border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b animate-fade-in">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          {item.hasSufficientData ? (
            <Badge variant="outline" className="shrink-0">Datos suficientes</Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">Datos limitados</Badge>
          )}
        </div>
        <ItemCategoryBreadcrumb category={item.category} />
      </div>

      {/* Price Metrics Section */}
      <div className="p-6 border-b animate-fade-in-up animate-stagger-1">
        <h2 className="text-md font-medium mb-4">Precios de Referencia</h2>
        <div className="flex flex-col tablet:flex-row justify-between gap-4">
          <MetricCard
            value={priceRangeDisplay}
            label="Rango Esperado"
          />
          <MetricCard
            variant="ghost"
            value={item.maxAcceptablePrice !== null ? formatCurrency(item.maxAcceptablePrice) : 'No disponible'}
            label="Precio Máximo Aceptable"
          />
          <MetricCard
            variant={item.stats.overpricingRate > 20 ? 'accent' : 'ghost'}
            value={formatPercentage(item.stats.overpricingRate)}
            label="Compras con Sobreprecio"
          />
        </div>
      </div>

      {/* Suppliers Section */}
      <div className="p-6 border-b animate-fade-in-up animate-stagger-2">
        <h2 className="text-md font-medium mb-4">Proveedores</h2>
        {suppliers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Proveedor</th>
                  <th className="text-right py-2 font-medium">Precio Promedio</th>
                  <th className="text-right py-2 font-medium">Compras</th>
                  <th className="text-left py-2 font-medium hidden tablet:table-cell">Regiones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.slice(0, 10).map((supplier) => (
                  <tr key={supplier.rut} className="border-b border-border/50">
                    <td className="py-3">
                      <span className="font-medium">{supplier.name || 'Sin nombre'}</span>
                      {supplier.size && (
                        <span className="text-xs text-muted-foreground ml-2">({supplier.size})</span>
                      )}
                    </td>
                    <td className="text-right py-3">
                      {formatCurrency(supplier.averagePrice)}
                    </td>
                    <td className="text-right py-3">
                      {formatNumber(supplier.purchaseCount)}
                    </td>
                    <td className="py-3 text-muted-foreground hidden tablet:table-cell">
                      {supplier.regionNames.slice(0, 3).join(', ')}
                      {supplier.regionNames.length > 3 && ` +${supplier.regionNames.length - 3}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length > 10 && (
              <p className="text-sm text-muted-foreground mt-3">
                Mostrando 10 de {suppliers.length} proveedores
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay proveedores registrados</p>
        )}
      </div>

      {/* Regions Section */}
      <div className="p-6 animate-fade-in-up animate-stagger-3">
        <h2 className="text-md font-medium mb-4">Distribución por Región</h2>
        {regions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Región</th>
                  <th className="text-right py-2 font-medium">Compras</th>
                  <th className="text-right py-2 font-medium">Precio Promedio</th>
                  <th className="text-right py-2 font-medium">% Sobreprecio</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region.regionId} className="border-b border-border/50">
                    <td className="py-3 font-medium">{region.regionName}</td>
                    <td className="text-right py-3">{formatNumber(region.purchaseCount)}</td>
                    <td className="text-right py-3">{formatCurrency(region.averagePrice)}</td>
                    <td className="text-right py-3">
                      <span className={region.overpricingRate > 20 ? 'text-destructive font-medium' : ''}>
                        {formatPercentage(region.overpricingRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay compras registradas por región</p>
        )}
      </div>

      {/* Footer / Stats Summary */}
      <div className="border-t p-6 mt-auto animate-fade-in-up animate-stagger-4">
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{formatNumber(item.stats.totalPurchases)}</strong> compras totales
          </span>
          <span>
            <strong className="text-foreground">{formatNumber(item.stats.overpricedPurchases)}</strong> con sobreprecio
          </span>
        </div>
      </div>
    </div>
  );
}
