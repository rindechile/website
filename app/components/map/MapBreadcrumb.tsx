import { motion, AnimatePresence } from 'framer-motion';
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
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <BreadcrumbItem>
            {viewState.level === 'country' ? (
              <BreadcrumbPage className="text-white">Chile</BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                onClick={onNavigateToCountry}
                className="cursor-pointer text-white/80 hover:text-white transition-all duration-150 hover:scale-105"
              >
                Chile
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        </motion.div>

        {/* Region */}
        <AnimatePresence mode="wait">
          {(viewState.level === 'region' || viewState.level === 'municipality') && viewState.selectedRegion && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <BreadcrumbSeparator className="text-white/40" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <BreadcrumbItem>
                  {viewState.level === 'region' ? (
                    <BreadcrumbPage className="text-white">{viewState.selectedRegion.properties.Region}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={onNavigateToRegion}
                      className="cursor-pointer text-white/80 hover:text-white transition-all duration-150 hover:scale-105"
                    >
                      {viewState.selectedRegion.properties.Region}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Municipality */}
        <AnimatePresence mode="wait">
          {viewState.level === 'municipality' && viewState.selectedMunicipality && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <BreadcrumbSeparator className="text-white/40" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white">{viewState.selectedMunicipality.properties.Comuna}</BreadcrumbPage>
                </BreadcrumbItem>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
