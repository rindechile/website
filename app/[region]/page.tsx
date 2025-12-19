'use client';

import { redirect } from 'next/navigation';
import { getCodeFromSlug } from '@/lib/region-slugs';
import { MapProvider } from '../contexts/MapContext';
import { ClientPageContent } from '../components/ClientPageContent';
import { RegionPageSkeleton } from '../components/RegionPageSkeleton';
import { useEffect, useState } from 'react';

interface RegionPageProps {
  params: Promise<{
    region: string;
  }>;
}

export default function RegionPage({ params }: RegionPageProps) {
  const [regionCode, setRegionCode] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then(({ region: slug }) => {
      const code = getCodeFromSlug(slug);
      
      if (!code) {
        redirect('/');
      } else {
        setRegionCode(code);
        setIsLoading(false);
      }
    });
  }, [params]);

  if (isLoading) {
    return <RegionPageSkeleton />;
  }

  return (
    <MapProvider initialRegionCode={regionCode || undefined}>
      <ClientPageContent />
    </MapProvider>
  );
}
