'use client';

import { motion } from 'framer-motion';
import { Skeleton } from "@/app/components/ui/skeleton";

export function PurchaseCardSkeleton() {
  return (
    <motion.div
      className="p-4 border border-border rounded-lg bg-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Municipality */}
      <div className="mb-2">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-3 flex justify-end">
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </motion.div>
  );
}

/**
 * Container for multiple purchase card skeletons
 */
export function PurchaseCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <PurchaseCardSkeleton key={i} />
      ))}
    </div>
  );
}
