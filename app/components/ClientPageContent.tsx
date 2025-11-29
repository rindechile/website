'use client';

import { useMapContext } from "../contexts/MapContext";
import { DetailPanel } from "./DetailPanel";
import MapContainerSuspense from "./map/MapContainerSuspense";
import { PurchasesTable } from "./purchases/PurchasesTable";

export function ClientPageContent() {
  const { detailPanelData } = useMapContext();

  return (
    <main className="w-full">
      <section className="flex flex-col tablet:flex-row w-full gap-8">
        <MapContainerSuspense />

        <div className="w-full tablet:w-3/5">
          <DetailPanel data={detailPanelData} />
        </div>
      </section>

      <section className="w-full">
        <PurchasesTable />
      </section>
    </main>
  );
}

// Explicit default export for module resolution
export default ClientPageContent;
