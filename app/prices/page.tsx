'use client';

import { ItemSearchInput } from '@/app/components/prices/ItemSearchInput';

export default function PricesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-3xl tablet:text-4xl desktop:text-5xl font-medium mb-6 leading-tight">
          Análisis de Precios
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Busca un producto para conocer su rango de precios de referencia,
          detectar anomalías y comparar proveedores.
        </p>
      </div>

      <ItemSearchInput autoFocus className="w-full" />

      <p className="mt-8 text-sm text-muted-foreground">
        Escribe al menos 2 caracteres para buscar
      </p>
    </div>
  );
}
