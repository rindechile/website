"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns, type Purchase } from "./columns";
import { useMapContext } from "../../contexts/MapContext";

export function PurchasesTable() {
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { detailPanelData } = useMapContext();

  useEffect(() => {
    let cancelled = false;

    async function fetchPurchases() {
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

        const response = await fetch(`/api/purchases?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch purchases data');
        }

        const result = await response.json() as {
          success: boolean;
          data?: Purchase[];
          error?: string;
        };

        if (!cancelled) {
          if (result.success && result.data) {
            setData(result.data);
          } else {
            setError(result.error || 'Failed to load purchases data');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching purchases:', err);
          setError('Unable to load purchases data. Please refresh and try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPurchases();

    return () => {
      cancelled = true;
    };
  }, [detailPanelData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading purchases data...</p>
      </div>
    );
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
      <DataTable columns={columns} data={data} />
    </div>
  );
}
