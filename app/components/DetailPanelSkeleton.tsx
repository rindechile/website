import { Skeleton } from "@/app/components/ui/skeleton";

export function DetailPanelSkeleton() {
  return (
    <div className="h-full overflow-y-auto rounded-lg bg-card p-8 border border-border">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 ml-4 shrink-0" />
        </div>
      </div>

      {/* Summary Card Skeleton */}
      <div className="rounded-lg p-6 border border-border mb-6">
        <div className="text-center">
          <Skeleton className="h-4 w-40 mx-auto mb-2" />
          <Skeleton className="h-10 w-24 mx-auto" />
        </div>
      </div>

      {/* Treemap Visualization Skeleton */}
      <div className="rounded-lg border border-border p-6 mb-6">
        <Skeleton className="h-4 w-56 mb-4" />

        {/* Breadcrumb Skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Treemap SVG Skeleton */}
        <div className="relative w-full">
          <Skeleton className="w-full h-[400px] rounded-lg" />
        </div>

        {/* Legend Skeleton */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}
