"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns, type Purchase } from "./columns";
import { useMapContext } from "../../contexts/MapContext";
import { PurchasesTableSkeleton } from "./PurchasesTableSkeleton";

export type FilterOptions = {
  items: string[];
  municipalities: string[];
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type ServerSortingState = {
  id: string;
  desc: boolean;
} | null;

export type FilterState = {
  itemName: string | null;
  municipalityName: string | null;
};

export function PurchasesTable() {
  const [data, setData] = useState<Purchase[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    items: [],
    municipalities: [],
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [sorting, setSorting] = useState<ServerSortingState>(null);
  const [filters, setFilters] = useState<FilterState>({
    itemName: null,
    municipalityName: null,
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
        const params = new URLSearchParams();

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

        // Add pagination parameters
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());

        // Add sorting parameters
        if (sorting) {
          params.append('sortBy', sorting.id);
          params.append('sortOrder', sorting.desc ? 'desc' : 'asc');
        }

        // Add filter parameters
        if (filters.itemName) {
          params.append('itemName', filters.itemName);
        }
        if (filters.municipalityName) {
          params.append('municipalityName', filters.municipalityName);
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
            pagination?: PaginationInfo;
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
            if (purchasesResult.pagination) {
              setPagination(purchasesResult.pagination);
            }
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
  }, [detailPanelData, pagination.page, pagination.limit, sorting, filters]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortingChange = (newSorting: ServerSortingState) => {
    setSorting(newSorting);
    // Reset to page 1 when sorting changes
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

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

  return (
    <DataTable
      columns={columns}
      data={data}
      filterOptions={filterOptions}
      pagination={pagination}
      sorting={sorting}
      filters={filters}
      onPageChange={handlePageChange}
      onSortingChange={handleSortingChange}
      onFiltersChange={handleFiltersChange}
    />
  );
}
