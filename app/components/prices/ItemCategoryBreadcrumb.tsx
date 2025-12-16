import type { ItemCategory } from '@/types/items';
import { ChevronRight } from 'lucide-react';

interface ItemCategoryBreadcrumbProps {
  category: ItemCategory;
}

export function ItemCategoryBreadcrumb({ category }: ItemCategoryBreadcrumbProps) {
  const parts = [
    category.categoryName,
    category.segmentName,
    category.familyName,
    category.className,
    category.commodityName,
  ].filter(Boolean);

  if (parts.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        Sin clasificación UNSPSC
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          <span>{part}</span>
        </span>
      ))}
    </div>
  );
}
