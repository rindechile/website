"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns, type Purchase } from "./columns";
import { useMapContext } from "../../contexts/MapContext";
import { PurchasesTableSkeleton } from "./PurchasesTableSkeleton";

export type FilterOptions = {
  items: string[];
  municipalities: string[];
  suppliers: string[];
};

export function PurchasesTable() {
  const [data, setData] = useState<Purchase[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    items: [],
    municipalities: [],
    suppliers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { detailPanelData } = useMapContext();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters based on current view
        const params = new URLSearchParams({
          page: '1',
          pageSize: '100',
        });

        if (detailPanelData) {
          params.append('level', detailPanelData.level);

          if (detailPanelData.level === 'region') {
            params.append('regionId', detailPanelData.regionId);
          } else if (detailPanelData.level === 'municipality') {
            params.append('municipalityId', detailPanelData.municipalityId.toString());
          }
        } else {
          params.append('level', 'country');
        }

        // Fetch both purchases data and filter options in parallel
        const [purchasesResponse, filtersResponse] = await Promise.all([
          fetch(`/api/purchases?${params.toString()}`),
          fetch(`/api/purchases/filters?${params.toString()}`),
        ]);

        if (!purchasesResponse.ok || !filtersResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [purchasesResult, filtersResult] = await Promise.all([
          purchasesResponse.json() as Promise<{
            success: boolean;
            data?: Purchase[];
            error?: string;
          }>,
          filtersResponse.json() as Promise<{
            success: boolean;
            data?: FilterOptions;
            error?: string;
          }>,
        ]);

        if (!cancelled) {
          if (purchasesResult.success && purchasesResult.data) {
            setData(purchasesResult.data);
          } else {
            setError(purchasesResult.error || 'Failed to load purchases data');
          }

          if (filtersResult.success && filtersResult.data) {
            setFilterOptions(filtersResult.data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching data:', err);
          setError('Unable to load data. Please refresh and try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [detailPanelData]);

  if (loading) {
    return <PurchasesTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Build title based on current view
  const getTitle = () => {
    if (!detailPanelData) return 'Purchases - Chile';

    switch (detailPanelData.level) {
      case 'country':
        return 'Purchases - Chile';
      case 'region':
        return `Purchases - ${detailPanelData.name}`;
      case 'municipality':
        return `Purchases - ${detailPanelData.name}, ${detailPanelData.regionName}`;
      default:
        return 'Purchases';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">{getTitle()}</h2>
      <DataTable columns={columns} data={data} filterOptions={filterOptions} />
    </div>
  );
}
