import type { BreadcrumbItem } from './hooks/useTreemapNavigation';

interface TreemapBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  loading: boolean;
  onBreadcrumbClick: (index: number) => void;
}

export function TreemapBreadcrumbs({ breadcrumbs, loading, onBreadcrumbClick }: TreemapBreadcrumbsProps) {
  return (
    <div className="mb-4 flex items-center gap-2 text-xs flex-wrap">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <button
            onClick={() => onBreadcrumbClick(index)}
            className={`${
              index === breadcrumbs.length - 1
                ? 'font-medium text-foreground/60 cursor-pointer'
                : 'text-muted-foreground hover:text-foreground'
            } transition-colors`}
            disabled={index === breadcrumbs.length - 1 || loading}
          >
            {breadcrumb.name}
          </button>
        </div>
      ))}
    </div>
  );
}
