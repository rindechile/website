"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { TableFilters } from "./TableFilters";
import { TableStatus } from "./TableStatus";
import { TablePagination } from "./TablePagination";
import { PurchaseCardList } from "./PurchaseCardList";
import type { Purchase } from "./columns";
import type { FilterOptions, PaginationInfo, ServerSortingState, FilterState } from "./PurchasesTable";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterOptions: FilterOptions;
  pagination?: PaginationInfo;
  sorting?: ServerSortingState;
  filters?: FilterState;
  onPageChange?: (page: number) => void;
  onSortingChange?: (sorting: ServerSortingState) => void;
  onFiltersChange?: (filters: FilterState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterOptions,
  pagination: serverPagination,
  sorting: serverSorting,
  onPageChange,
  onSortingChange,
  onFiltersChange,
}: DataTableProps<TData, TValue>) {
  const [clientSorting, setClientSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Use server-side mode if callbacks are provided
  const useServerMode = !!serverPagination && !!onPageChange && !!onSortingChange && !!onFiltersChange;

  const [clientPagination, setClientPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Convert server sorting to TanStack Table format
  const tableSorting = useServerMode && serverSorting
    ? [{ id: serverSorting.id, desc: serverSorting.desc }]
    : clientSorting;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: useServerMode ? undefined : getPaginationRowModel(),
    getSortedRowModel: useServerMode ? undefined : getSortedRowModel(),
    getFilteredRowModel: useServerMode ? undefined : getFilteredRowModel(),
    onSortingChange: useServerMode
      ? (updater) => {
          const newSorting = typeof updater === 'function' ? updater(tableSorting) : updater;
          if (newSorting.length > 0) {
            onSortingChange({ id: newSorting[0].id, desc: newSorting[0].desc });
          } else {
            onSortingChange(null);
          }
        }
      : setClientSorting,
    onColumnFiltersChange: useServerMode
      ? (updater) => {
          const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
          const itemNameFilter = newFilters.find(f => f.id === 'item_name')?.value as string | undefined;
          const municipalityNameFilter = newFilters.find(f => f.id === 'municipality_name')?.value as string | undefined;
          onFiltersChange({
            itemName: itemNameFilter || null,
            municipalityName: municipalityNameFilter || null,
          });
          setColumnFilters(newFilters);
        }
      : setColumnFilters,
    onPaginationChange: useServerMode ? undefined : setClientPagination,
    manualPagination: useServerMode,
    manualSorting: useServerMode,
    manualFiltering: useServerMode,
    pageCount: useServerMode ? serverPagination.totalPages : undefined,
    state: {
      sorting: tableSorting,
      columnFilters,
      pagination: useServerMode
        ? { pageIndex: serverPagination.page - 1, pageSize: serverPagination.limit }
        : clientPagination,
    },
  });

  return (
    <div className="space-y-4">
      <TableFilters
        table={table}
        filterOptions={filterOptions}
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
      />

      {/* Mobile: Card View */}
      <div className="tablet:hidden">
        <PurchaseCardList purchases={data as Purchase[]} />
      </div>

      {/* Tablet+: Table View */}
      <div className="hidden tablet:block border border-border rounded-lg">
        <Table aria-label="Tabla de compras públicas">
          <TableCaption className="sr-only">
            Tabla de compras públicas con posible sobreprecio. Presiona Enter o Espacio en una fila para ver más detalles en ChileCompra.
          </TableCaption>

          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
                <TableHead className="w-12" aria-label="Acción">
                  <span className="sr-only">Acción</span>
                </TableHead>
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const handleRowActivation = () => {
                  const chilecompraId = (row.original as { chilecompra_code: string }).chilecompra_code;
                  window.open(`https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx?codigoOC=${chilecompraId}`, '_blank');
                };

                return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={handleRowActivation}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowActivation();
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`Ver orden de compra ${(row.original as { chilecompra_code: string }).chilecompra_code} en ChileCompra (abre en nueva pestaña)`}
                  className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="w-12">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </TableCell>
                </TableRow>
              );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No se han encontrado datos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <TableStatus
          table={table}
          serverPagination={useServerMode ? {
            total: serverPagination.total,
            page: serverPagination.page,
            limit: serverPagination.limit,
          } : undefined}
        />
        <TablePagination
          table={table}
          onPageChange={useServerMode ? onPageChange : undefined}
        />
      </div>
    </div>
  );
}
