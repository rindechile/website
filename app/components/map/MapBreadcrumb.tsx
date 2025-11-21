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
            <BreadcrumbPage>Chile</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              onClick={onNavigateToCountry}
              className="cursor-pointer hover:text-gray-900"
            >
              Chile
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Region */}
        {(viewState.level === 'region' || viewState.level === 'municipality') && viewState.selectedRegion && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {viewState.level === 'region' ? (
                <BreadcrumbPage>{viewState.selectedRegion.properties.Region}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={onNavigateToRegion}
                  className="cursor-pointer hover:text-gray-900"
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
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{viewState.selectedMunicipality.properties.Comuna}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
