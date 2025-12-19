'use client';

import { motion } from 'framer-motion';
import { Skeleton } from "@/app/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function DetailPanelSkeleton() {
  return (
    <motion.div
      className="h-full rounded-lg border border-border flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Skeleton */}
      <motion.div 
        className="p-6 border-b shrink-0"
        variants={itemVariants}
      >
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-7 w-48" />
        </div>
      </motion.div>

      {/* Summary Cards Skeleton */}
      <motion.div 
        className="p-6 border-b shrink-0"
        variants={itemVariants}
      >
        <div className="flex flex-col tablet:flex-row justify-between gap-8">
          {/* Left section: Anomalies percentage and chart */}
          <div className="flex flex-col w-full max-w-[48rem] tablet:flex-row gap-8 items-stretch">
            {/* Anomalies percentage card */}
            <div className="rounded-lg p-6 border border-border">
              <div className="text-center">
                <Skeleton className="h-4 w-40 mx-auto mb-2" />
                <Skeleton className="h-10 w-24 mx-auto" />
              </div>
            </div>
            
            {/* Area chart skeleton */}
            <div className="flex-1 rounded-lg p-6 border border-border">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="w-full h-32" />
            </div>
          </div>

          {/* Right section: Budget cards */}
          <div className="flex flex-col tablet:flex-row gap-4">
            {/* Total budget card */}
            <div className="rounded-lg p-6 border border-border bg-muted/50">
              <div className="text-center">
                <Skeleton className="h-4 w-36 mx-auto mb-2" />
                <Skeleton className="h-8 w-28 mx-auto" />
              </div>
            </div>

            {/* Per capita card (conditional, shown for municipalities) */}
            <div className="rounded-lg p-6 border border-border bg-muted/50">
              <div className="text-center">
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-8 w-24 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Treemap Visualization Skeleton */}
      <motion.div 
        className="p-6 flex flex-col flex-1 min-h-0"
        variants={itemVariants}
      >
        <Skeleton className="h-5 w-64 mb-2" />
        <Skeleton className="h-4 w-full max-w-2xl mb-4" />

        {/* Breadcrumb Skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Treemap SVG Skeleton */}
        <div className="relative w-full flex-1 min-h-0">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>

        {/* Legend Skeleton */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </motion.div>

      {/* Footer Legend Skeleton */}
      <motion.div 
        className="border-t flex flex-col gap-8 desktop:flex-row justify-between shrink-0"
        variants={itemVariants}
      >
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-5 w-56" />
          <div className="flex flex-row gap-4">
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-full desktop:w-32" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full desktop:w-32" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-full desktop:w-32" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t desktop:border-t-0 p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-full max-w-md" />
          <Skeleton className="h-3 w-full max-w-sm" />
        </div>
      </motion.div>
    </motion.div>
  );
}
