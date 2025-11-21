import type { MapViewState } from '@/types/map';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb';

interface MapBreadcrumbProps {
  viewState: MapViewState;
  onNavigateToCountry: () => void;
  onNavigateToRegion?: () => void;
}

export function MapBreadcrumb({
  viewState,
  onNavigateToCountry,
  onNavigateToRegion,
}: MapBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Chile (Country) */}
        <BreadcrumbItem>
          {viewState.level === 'country' ? (
            <BreadcrumbPage className="text-white">Chile</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              onClick={onNavigateToCountry}
              className="cursor-pointer text-white/80 hover:text-white"
            >
              Chile
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Region */}
        {(viewState.level === 'region' || viewState.level === 'municipality') && viewState.selectedRegion && (
          <>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              {viewState.level === 'region' ? (
                <BreadcrumbPage className="text-white">{viewState.selectedRegion.properties.Region}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={onNavigateToRegion}
                  className="cursor-pointer text-white/80 hover:text-white"
                >
                  {viewState.selectedRegion.properties.Region}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Municipality */}
        {viewState.level === 'municipality' && viewState.selectedMunicipality && (
          <>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">{viewState.selectedMunicipality.properties.Comuna}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
