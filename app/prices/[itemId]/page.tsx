'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItemDetailPanel } from '@/app/components/prices/ItemDetailPanel';
import { ItemDetailSkeleton } from '@/app/components/prices/ItemDetailSkeleton';
import { ItemSearchInput } from '@/app/components/prices/ItemSearchInput';
import type { ItemDetail, ItemSupplier, ItemRegionStats, ItemDetailResponse } from '@/types/items';

interface ItemPageProps {
  params: Promise<{
    itemId: string;
  }>;
}

interface ItemData {
  item: ItemDetail;
  suppliers: ItemSupplier[];
  regions: ItemRegionStats[];
}

export default function ItemPage({ params }: ItemPageProps) {
  const router = useRouter();
  const [itemId, setItemId] = useState<number | null>(null);
  const [data, setData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(({ itemId: id }) => {
      const parsed = parseInt(id, 10);
      if (isNaN(parsed)) {
        router.push('/prices');
      } else {
        setItemId(parsed);
      }
    });
  }, [params, router]);

  // Fetch item data
  useEffect(() => {
    if (itemId === null) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/items/${itemId}`);
        const result: ItemDetailResponse = await response.json();

        if (!result.success) {
          setError(result.error || 'Error al cargar el producto');
          return;
        }

        if (result.data) {
          setData(result.data);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  return (
    <div className="flex flex-col gap-8 w-full py-8">
      {/* Search bar at top */}
      <div className="flex justify-center">
        <ItemSearchInput className="w-full max-w-2xl" />
      </div>

      {/* Content */}
      <div className="w-full">
        {loading && <ItemDetailSkeleton />}

        {error && (
          <div className="h-full flex items-center justify-center rounded-lg border border-border bg-card p-12">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-destructive mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => router.push('/prices')}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Volver a buscar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <ItemDetailPanel
            item={data.item}
            suppliers={data.suppliers}
            regions={data.regions}
          />
        )}
      </div>
    </div>
  );
}
