import type { BreadcrumbItem } from './hooks/useTreemapNavigation';

interface SankeyBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  loading: boolean;
  onBreadcrumbClick: (index: number) => void;
}

export function SankeyBreadcrumbs({ breadcrumbs, loading, onBreadcrumbClick }: SankeyBreadcrumbsProps) {
  const isLast = (index: number) => index === breadcrumbs.length - 1;

  return (
    <nav aria-label="Navegación de categorías" className="mb-4">
      <ol className="flex items-center gap-1 text-sm flex-wrap" role="list">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="flex items-center gap-1 animate-fade-in">
            {index > 0 && (
              <svg
                className="h-4 w-4 text-muted-foreground shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <button
              onClick={() => onBreadcrumbClick(index)}
              className={`min-h-[44px] px-2 rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isLast(index)
                  ? 'font-medium text-foreground cursor-default'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              disabled={isLast(index) || loading}
              aria-current={isLast(index) ? 'page' : undefined}
              aria-disabled={isLast(index) || loading}
            >
              {breadcrumb.name}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
