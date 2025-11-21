import { Suspense } from "react";
import { MapContainer } from "./components/map/MapContainer";
import { Skeleton } from "@/components/ui/skeleton";

function MapContainerSuspense() {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <MapContainer />
    </Suspense>
  );
}

function MapLoadingFallback() {
  return (
    <div className="w-full h-screen flex flex-col" style={{ backgroundColor: '#121A1D' }}>
      <header className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
            <Skeleton className="h-6 w-48 bg-white/10" />
          </div>
          <Skeleton className="h-9 w-32 bg-white/10" />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white/20 border-t-white" />
          <p className="text-white/80">Cargando mapa...</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="w-full h-screen" style={{ backgroundColor: '#121A1D' }}>
      <MapContainerSuspense />
    </main>
  );
}
 