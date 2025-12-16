'use client';

import { Suspense } from "react";
import { MapContainer } from "./MapContainer";
import { Skeleton } from "@/app/components/ui/skeleton";

interface MapContainerSuspenseProps {
  initialRegionCode?: number;
}

function MapLoadingFallback() {
  return (
    <div className="w-full py-8 tablet:w-2/5 flex flex-col bg-secondary rounded-lg border border-border">
      {/* Header Skeleton */}
      <div className="px-8">
        <Skeleton className="h-7 w-64 bg-foreground/10 mb-2" />
        <Skeleton className="h-4 w-80 bg-foreground/10" />
      </div>

      {/* Map Loading State */}
      <div className="flex-1 overflow-hidden my-8">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-foreground/20 border-t-foreground" />
            <p className="text-foreground/80">Cargando mapa...</p>
          </div>
        </div>
      </div>

      {/* Legend Skeleton */}
      <div className="px-8">
        <Skeleton className="h-16 w-full bg-foreground/10" />
      </div>
    </div>
  );
}

export default function MapContainerSuspense() {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <MapContainer />
    </Suspense>
  );
}
