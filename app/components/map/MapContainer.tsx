'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChileMap } from './ChileMap';
import { MapLegend } from './MapLegend';
import { MunicipalityDetail } from './MunicipalityDetail';
import { MapBreadcrumb } from './MapBreadcrumb';
import { InfoSheet } from './InfoSheet';
import { Logo } from '../Logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, RefreshCw, Share2, Check, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type {
  MapViewState,
  EnrichedRegionData,
  EnrichedMunicipalityData,
  ColorScale,
  MunicipalityData,
} from '@/types/map';
import {
  loadRegionsGeoJSON,
  enrichRegionData,
  getMunicipalityOverpricingRange,
  getRegionOverpricingRange,
  loadMunicipalitiesGeoJSON,
  enrichMunicipalityData,
} from '@/app/lib/data-service';

export function MapContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [regionsData, setRegionsData] = useState<EnrichedRegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>({
    level: 'country',
    selectedRegion: null,
    selectedMunicipality: null,
  });
  const [selectedMunicipalityData, setSelectedMunicipalityData] = useState<{
    name: string;
    regionName: string;
    data: MunicipalityData | null;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [municipalitiesData, setMunicipalitiesData] = useState<EnrichedMunicipalityData[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [nationalAverage, setNationalAverage] = useState<number | undefined>(undefined);
  const [shareButtonText, setShareButtonText] = useState<'share' | 'copied'>('share');
  const [ariaLiveMessage, setAriaLiveMessage] = useState<string>('');

  // Initialize color scale
  const [colorScale, setColorScale] = useState<ColorScale>({
    domain: [0, 100],
    lowColor: '#68CCDB',
    highColor: '#ED2472',
    interpolate: (t: number) => '',
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Load regions GeoJSON
        const regionsGeoJSON = await loadRegionsGeoJSON();

        // Enrich with pre-computed overpricing data (synchronous now)
        const enriched = enrichRegionData(regionsGeoJSON);

        // Get region overpricing range for color scale (used in country view)
        const range = getRegionOverpricingRange();

        // Calculate national average
        const totalOverpricing = enriched.reduce((sum, region) => 
          sum + region.averageOverpricing, 0
        );
        const average = enriched.length > 0 ? totalOverpricing / enriched.length : undefined;
        setNationalAverage(average);

        setRegionsData(enriched);
        setColorScale(prev => ({
          ...prev,
          domain: range,
        }));
      } catch (err) {
        console.error('Error loading map data:', err);
        setError('Failed to load map data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Initialize view from URL params
  useEffect(() => {
    const regionParam = searchParams.get('region');
    if (regionParam && regionsData.length > 0) {
      const region = regionsData.find(
        r => r.feature.properties.codregion.toString() === regionParam
      );
      
      if (region && viewState.level === 'country') {
        setViewState({
          level: 'region',
          selectedRegion: region.feature,
          selectedMunicipality: null,
        });
      }
    }
  }, [searchParams, regionsData]);

  // Load municipalities when region is selected
  useEffect(() => {
    async function loadMunicipalities() {
      if (viewState.level === 'region' && viewState.selectedRegion) {
        setLoadingMunicipalities(true);
        try {
          const regionCode = viewState.selectedRegion.properties.codregion;
          const municipalityCollection = await loadMunicipalitiesGeoJSON(regionCode);
          const enriched = enrichMunicipalityData(municipalityCollection);
          setMunicipalitiesData(enriched);
        } catch (error) {
          console.error('Error loading municipalities for detail:', error);
          setMunicipalitiesData([]);
        } finally {
          setLoadingMunicipalities(false);
        }
      } else {
        setMunicipalitiesData([]);
        setLoadingMunicipalities(false);
      }
    }

    loadMunicipalities();
  }, [viewState.level, viewState.selectedRegion]);

  // Update color scale range based on view level
  useEffect(() => {
    if (viewState.level === 'country') {
      // Use region range for country view
      const range = getRegionOverpricingRange();
      setColorScale(prev => ({
        ...prev,
        domain: range,
      }));
    } else if (viewState.level === 'region') {
      // Use municipality range for region view
      const range = getMunicipalityOverpricingRange();
      setColorScale(prev => ({
        ...prev,
        domain: range,
      }));
    }
  }, [viewState.level]);

  // Handle region click
  const handleRegionClick = (regionCode: string) => {
    const region = regionsData.find(
      r => r.feature.properties.codregion.toString() === regionCode
    );

    if (region) {
      setViewState({
        level: 'region',
        selectedRegion: region.feature,
        selectedMunicipality: null,
      });
      
      // Update URL
      const params = new URLSearchParams();
      params.set('region', regionCode);
      router.push(`?${params.toString()}`, { scroll: false });
      
      // Announce to screen readers
      setAriaLiveMessage(`Mostrando región ${region.feature.properties.Region}`);
    }
  };

  // Handle municipality click
  const handleMunicipalityClick = (municipalityCode: string) => {
    const municipality = municipalitiesData.find(
      m => m.feature.properties.cod_comuna.toString() === municipalityCode
    );

    if (municipality) {
      setSelectedMunicipalityData({
        name: municipality.feature.properties.Comuna,
        regionName: viewState.selectedRegion?.properties.Region || '',
        data: municipality.data,
      });
      setDialogOpen(true);
      
      // Announce to screen readers
      setAriaLiveMessage(`Mostrando detalles de ${municipality.feature.properties.Comuna}`);
    }
  };

  // Handle back navigation
  const handleBackToCountry = () => {
    setViewState({
      level: 'country',
      selectedRegion: null,
      selectedMunicipality: null,
    });
    
    // Clear URL params
    router.push('/', { scroll: false });
    
    // Announce to screen readers
    setAriaLiveMessage('Mostrando vista de Chile completo');
  };

  // Handle retry for errors
  const handleRetry = () => {
    window.location.reload();
  };

  // Handle share button
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareButtonText('copied');
      setTimeout(() => setShareButtonText('share'), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key to go back
      if (event.key === 'Escape') {
        if (dialogOpen) {
          setDialogOpen(false);
        } else if (viewState.level === 'region') {
          handleBackToCountry();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState.level, dialogOpen]);

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col" style={{ backgroundColor: '#121A1D' }}>
        {/* Header Skeleton */}
        <header className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
              <Skeleton className="h-6 w-48 bg-white/10" />
            </div>
            <Skeleton className="h-9 w-32 bg-white/10" />
          </div>
        </header>

        {/* Title Skeleton */}
        <div className="px-8 py-4 text-center">
          <Skeleton className="h-8 w-96 mx-auto bg-white/10" />
        </div>

        {/* Map Loading State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white/20 border-t-white" />
            <p className="text-white/80">Cargando datos del mapa...</p>
            <p className="text-white/50 text-sm">Preparando visualización</p>
          </div>
        </div>

        {/* Legend Skeleton */}
        <div className="px-8 pb-8">
          <Skeleton className="h-16 w-full bg-white/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#121A1D' }}>
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Error al cargar datos</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>{error}</p>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col" style={{ backgroundColor: '#121A1D' }}>
      {/* Header */}
      <header className="px-8 py-6" style={{ backgroundColor: '#121A1D' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-semibold text-white">
              Sobreprecios en Chile
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <InfoSheet />
            {viewState.level === 'region' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:text-white hover:bg-white/10"
                aria-label="Compartir vista actual"
              >
                {shareButtonText === 'share' ? (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                )}
              </Button>
            )}
            <div className="text-white font-light">
              Transparenta 2025
            </div>
          </div>
        </div>
        
        {/* Breadcrumb Navigation */}
        {viewState.level !== 'country' && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCountry}
              className="text-white hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Chile
            </Button>
            <div className="text-white/60">
              <MapBreadcrumb
                viewState={viewState}
                onNavigateToCountry={handleBackToCountry}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Title */}
      <div className="px-8 py-4 text-center">
        <h2 className="text-2xl font-light text-white">
          % de compras con sobreprecio por región en 2025
        </h2>
      </div>

      {/* Map Container */}
      <div className="flex-1 px-8 pb-2 overflow-hidden relative">
        <div className="w-full h-full" style={{ backgroundColor: '#121A1D' }}>
          <ChileMap
            regionsData={regionsData}
            municipalitiesData={municipalitiesData}
            loadingMunicipalities={loadingMunicipalities}
            onRegionClick={handleRegionClick}
            onMunicipalityClick={handleMunicipalityClick}
            viewState={viewState}
            colorScale={colorScale}
          />
        </div>
        
        {/* Mobile Zoom Controls - Fixed Position */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 md:hidden">
          <Button
            size="icon"
            variant="secondary"
            className="h-11 w-11 bg-white/90 hover:bg-white shadow-lg"
            aria-label="Acercar"
            onClick={() => {
              // This would need to be connected to ChileMap's zoom functionality
              // For now, it's a placeholder for the UI
            }}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-11 w-11 bg-white/90 hover:bg-white shadow-lg"
            aria-label="Alejar"
            onClick={() => {
              // This would need to be connected to ChileMap's zoom functionality
              // For now, it's a placeholder for the UI
            }}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-11 w-11 bg-white/90 hover:bg-white shadow-lg"
            aria-label="Restablecer vista"
            onClick={() => {
              // This would need to be connected to ChileMap's zoom functionality
              // For now, it's a placeholder for the UI
            }}
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Legend at Bottom */}
      <div className="px-8 pb-8">
        <MapLegend colorScale={colorScale} nationalAverage={nationalAverage} />
      </div>

      {/* Municipality Detail Dialog */}
      {selectedMunicipalityData && (
        <MunicipalityDetail
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          municipalityName={selectedMunicipalityData.name}
          regionName={selectedMunicipalityData.regionName}
          data={selectedMunicipalityData.data}
        />
      )}
      
      {/* ARIA Live Region for Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaLiveMessage}
      </div>
    </div>
  );
}
