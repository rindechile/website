interface TreemapLegendProps {
  breadcrumbsLength: number;
}

export function TreemapLegend({ breadcrumbsLength }: TreemapLegendProps) {
  const getHelperText = () => {
    if (breadcrumbsLength === 1) {
      return 'Haz clic en un segmento para ver categorías';
    } else if (breadcrumbsLength === 2) {
      return 'Haz clic en una familia para ver clases';
    } else if (breadcrumbsLength === 3) {
      return 'Haz clic en una clase para ver detalles';
    }
    return null;
  };

  const helperText = getHelperText();

  return (
    <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
      <span className="text-muted-foreground">Monto de compra:</span>
      <div className="flex items-center gap-2">
        <div
          className="h-4 w-8 rounded"
          style={{ background: 'linear-gradient(to right, oklch(0.652 0.236 332.23), oklch(0.652 0.236 138.18))' }}
        />
        <span>Bajo → Alto</span>
      </div>
      {helperText && (
        <span className="text-muted-foreground ml-4">{helperText}</span>
      )}
    </div>
  );
}
