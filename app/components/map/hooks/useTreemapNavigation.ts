import { useState, useCallback } from 'react';
import type { TreemapNode, TreemapHierarchy } from '@/types/map';
import { getTreemapData } from '@/app/lib/data-service';

export interface BreadcrumbItem {
  name: string;
  categoryId?: number;
  segmentId?: number;
  familyId?: number;
}

interface UseTreemapNavigationProps {
  initialData: TreemapHierarchy;
  level: 'country' | 'region' | 'municipality';
  code?: string;
}

export function useTreemapNavigation({ initialData, level, code }: UseTreemapNavigationProps) {
  const [data, setData] = useState<TreemapHierarchy>(initialData);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: initialData.name }]);
  const [loading, setLoading] = useState(false);

  // Reset when initialData changes
  const resetNavigation = useCallback((newData: TreemapHierarchy) => {
    setData(newData);
    setBreadcrumbs([{ name: newData.name }]);
  }, []);

  // Handle drilling down into a node
  const handleDrillDown = useCallback(async (node: TreemapNode) => {
    setLoading(true);
    try {
      let newData: TreemapHierarchy | null = null;

      if (node.type === 'category') {
        // Drill down to segments
        newData = await getTreemapData(level, code, node.id);
        if (newData) {
          setBreadcrumbs(prev => [...prev, { name: node.name, categoryId: node.id }]);
        }
      } else if (node.type === 'segment') {
        // Drill down to families
        const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        newData = await getTreemapData(level, code, currentBreadcrumb.categoryId, node.id);
        if (newData) {
          setBreadcrumbs(prev => [...prev, {
            name: node.name,
            categoryId: currentBreadcrumb.categoryId,
            segmentId: node.id
          }]);
        }
      } else if (node.type === 'family') {
        // Drill down to classes
        const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        newData = await getTreemapData(
          level,
          code,
          currentBreadcrumb.categoryId,
          currentBreadcrumb.segmentId,
          node.id
        );
        if (newData) {
          setBreadcrumbs(prev => [...prev, {
            name: node.name,
            categoryId: currentBreadcrumb.categoryId,
            segmentId: currentBreadcrumb.segmentId,
            familyId: node.id
          }]);
        }
      }

      if (newData) {
        setData(newData);
      }
    } catch (error) {
      console.error('Failed to drill down:', error);
    } finally {
      setLoading(false);
    }
  }, [level, code, breadcrumbs]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback(async (index: number) => {
    if (index === breadcrumbs.length - 1) return; // Already at this level

    setLoading(true);
    try {
      const breadcrumb = breadcrumbs[index];
      let newData: TreemapHierarchy | null = null;

      if (index === 0) {
        // Go back to categories view
        newData = await getTreemapData(level, code);
      } else if (breadcrumb.familyId !== undefined) {
        // Go to classes view
        newData = await getTreemapData(
          level,
          code,
          breadcrumb.categoryId,
          breadcrumb.segmentId,
          breadcrumb.familyId
        );
      } else if (breadcrumb.segmentId !== undefined) {
        // Go to families view
        newData = await getTreemapData(level, code, breadcrumb.categoryId, breadcrumb.segmentId);
      } else if (breadcrumb.categoryId !== undefined) {
        // Go to segments view
        newData = await getTreemapData(level, code, breadcrumb.categoryId);
      }

      if (newData) {
        setData(newData);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      }
    } catch (error) {
      console.error('Failed to navigate:', error);
    } finally {
      setLoading(false);
    }
  }, [breadcrumbs, level, code]);

  return {
    data,
    breadcrumbs,
    loading,
    handleDrillDown,
    handleBreadcrumbClick,
    resetNavigation,
  };
}
