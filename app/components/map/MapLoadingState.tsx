import { Skeleton } from '@/app/components/ui/skeleton';
import { Loading } from '@/app/components/ui/loading';

export function MapLoadingState() {
  return (
    <div className="w-full py-8 tablet:w-2/5 flex flex-col bg-secondary rounded-lg border border-border animate-fade-in">
      {/* Header Skeleton */}
      <div className="px-8">
        <Skeleton className="h-7 w-64 bg-foreground/10 mb-2" />
        <Skeleton className="h-4 w-80 bg-foreground/10" />
      </div>

      {/* Map Loading State */}
      <div className="flex-1 overflow-hidden my-8">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loading size="lg" />
            <p className="text-foreground/80 animate-fade-in">Cargando datos del mapa...</p>
            <p className="text-foreground/50 text-sm animate-fade-in animate-stagger-1">Preparando visualización</p>
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
