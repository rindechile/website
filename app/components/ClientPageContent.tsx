'use client';

import { useMapContext } from "../contexts/MapContext";
import { DetailPanel } from "./DetailPanel";
import MapContainerSuspense from "./map/MapContainerSuspense";
import { PurchasesTable } from "./purchases/PurchasesTable";
import { DetailPanelSkeleton } from "./DetailPanelSkeleton";
import { PurchasesTableSkeleton } from "./purchases/PurchasesTableSkeleton";

export function ClientPageContent() {
  const { detailPanelData, loading } = useMapContext();

  return (
    <main className="flex flex-col gap-8 w-full">

      {/* Top Section */}
      <section className="flex flex-col tablet:flex-row w-full h-screen gap-8">

        <div className="w-full tablet:w-1/5 flex flex-col gap-4">
          <section className="p-8 border rounded-lg flex flex-col gap-4">
            <h1 className="text-2xl font-medium">¿Dónde están las compras públicas que merecen atención?</h1>

            <p className="text-sm font-light">
              Descubre dónde se concentran las compras que superan significativamente el rango histórico de precio. 
            </p>

            <p className="text-sm font-light">
              Explora a nivel nacional, regional y municipal.
            </p>
          </section>

          <MapContainerSuspense />

        </div>

        <section className="w-full tablet:w-4/5">
          {loading ? (
            <DetailPanelSkeleton />
          ) : (
            <DetailPanel data={detailPanelData} />
          )}
        </section>

      </section>

      {/* Purchases Table Section */}
      <section className="w-full">
        {loading ? (
          <PurchasesTableSkeleton />
        ) : (
          <PurchasesTable />
        )}
      </section>
    </main>
  );
}

// Explicit default export for module resolution
export default ClientPageContent;
