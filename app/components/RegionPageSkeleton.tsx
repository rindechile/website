'use client';

import { motion } from 'framer-motion';
import { Skeleton } from "@/app/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

/**
 * Skeleton for the region detail page
 * Matches the structure of the main page with map and detail panel
 */
export function RegionPageSkeleton() {
  return (
    <motion.div
      className="h-screen flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Skeleton */}
      <motion.div 
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        variants={itemVariants}
      >
        <div className="flex h-16 items-center px-4 tablet:px-6">
          <Skeleton className="h-8 w-32" />
          <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="flex-1 flex flex-col desktop:flex-row overflow-hidden"
        variants={itemVariants}
      >
        {/* Map Section Skeleton */}
        <div className="flex-1 relative bg-muted/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="h-10 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </div>
          
          {/* Map Controls Skeleton */}
          <div className="absolute bottom-4 left-4 space-y-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>

          {/* Legend Skeleton */}
          <div className="absolute bottom-4 right-4 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panel Skeleton */}
        <motion.div 
          className="w-full desktop:w-[42rem] desktop:max-w-[42rem] bg-background border-t desktop:border-t-0 desktop:border-l overflow-hidden"
          variants={itemVariants}
        >
          <div className="h-full p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div>
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="rounded-lg border border-border p-4">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-border p-6">
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="w-full h-64" />
            </div>

            {/* Additional content */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
