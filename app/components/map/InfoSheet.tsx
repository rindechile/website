'use client';

import { Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet';

export function InfoSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-white/10"
          aria-label="Información sobre la metodología"
        >
          <Info className="h-4 w-4 mr-2" />
          Metodología
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#1a2428] border-white/10 text-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white text-2xl">
            Sobre esta herramienta
          </SheetTitle>
          <SheetDescription className="text-white/70">
            Transparencia en las compras públicas de Chile
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* What is Overpricing */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-[#68CCDB]">
              ¿Qué es el sobreprecio?
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              El sobreprecio se identifica cuando el precio pagado por un producto en una compra pública 
              excede significativamente el precio de mercado para el mismo producto. Este análisis compara 
              cada transacción con precios de referencia históricos y de mercado.
            </p>
          </section>

          {/* Methodology */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-[#68CCDB]">
              Metodología
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-3">
              Los datos presentados corresponden a compras públicas realizadas a través del sistema 
              de Chile Compra durante el año 2025. El análisis incluye:
            </p>
            <ul className="text-sm text-white/80 space-y-2 list-disc list-inside">
              <li>Comparación de precios con referencias de mercado</li>
              <li>Identificación de transacciones con precios anormales</li>
              <li>Agregación de datos a nivel comunal y regional</li>
              <li>Cálculo de porcentajes de sobreprecio por jurisdicción</li>
            </ul>
          </section>

          {/* How to Read the Map */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-[#68CCDB]">
              Cómo leer el mapa
            </h3>
            <div className="space-y-3 text-sm text-white/80">
              <p>
                <strong className="text-white">Colores:</strong> Las regiones y comunas se colorean según 
                su porcentaje de compras con sobreprecio. Los tonos celestes indican porcentajes bajos, 
                mientras que los tonos rosados indican porcentajes altos.
              </p>
              <p>
                <strong className="text-white">Interacción:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Haz clic en una región para ver las comunas</li>
                <li>Haz clic en una comuna para ver detalles completos</li>
                <li>Usa el botón "Volver a Chile" o presiona ESC para regresar</li>
                <li>Pasa el mouse sobre las áreas para ver información rápida</li>
              </ul>
            </div>
          </section>

          {/* Data Interpretation */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-[#68CCDB]">
              Interpretación de datos
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-3">
              Los porcentajes mostrados representan la proporción de compras que presentaron sobreprecio 
              respecto al total de compras analizadas en cada jurisdicción.
            </p>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs text-white/60 mb-2">Rangos de referencia:</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFBA00' }}></div>
                  <span className="text-white/80">Bajo (≤ 12%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF0D5D' }}></div>
                  <span className="text-white/80">Medio (12% - 18%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#720000' }}></div>
                  <span className="text-white/80">Alto (&gt; 18%)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Data Source */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-[#68CCDB]">
              Fuente de datos
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Los datos provienen del sistema de Chile Compra (www.chicompra.cl), la plataforma oficial 
              de compras públicas del Estado de Chile. Todos los datos son de acceso público y han sido 
              procesados para facilitar su análisis y visualización.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-[#68CCDB]">
              Actualizaciones
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Esta herramienta se actualiza periódicamente con nuevos datos de compras públicas. 
              La última actualización corresponde a datos procesados hasta noviembre de 2025.
            </p>
          </section>

          {/* Footer */}
          <section className="border-t border-white/10 pt-4 mt-8">
            <p className="text-xs text-white/50">
              Desarrollado por Transparenta para promover la transparencia en las compras públicas de Chile.
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
