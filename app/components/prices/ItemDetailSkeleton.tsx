import { Skeleton } from '@/app/components/ui/skeleton';

export function ItemDetailSkeleton() {
  return (
    <div className="h-full rounded-lg border border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-64 mb-3" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Metrics Section */}
      <div className="p-6 border-b">
        <div className="flex flex-col tablet:flex-row justify-between gap-4">
          <div className="text-center">
            <Skeleton className="h-16 w-40 rounded-md mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-16 w-32 rounded-md mb-2" />
            <Skeleton className="h-4 w-28 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-16 w-28 rounded-md mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>

      {/* Suppliers Section */}
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Regions Section */}
      <div className="p-6">
        <Skeleton className="h-6 w-28 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
