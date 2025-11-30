import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";

interface TablePaginationProps<TData> {
  table: Table<TData>;
  onPageChange?: (page: number) => void;
}

export function TablePagination<TData>({ table, onPageChange }: TablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  // Use server-side pagination if callback is provided
  const useServerPagination = !!onPageChange;

  const handleFirstPage = () => {
    if (useServerPagination) {
      onPageChange(1);
    } else {
      table.setPageIndex(0);
    }
  };

  const handlePreviousPage = () => {
    if (useServerPagination) {
      onPageChange(pageIndex); // pageIndex is 0-based, so current pageIndex = previous page number
    } else {
      table.previousPage();
    }
  };

  const handleNextPage = () => {
    if (useServerPagination) {
      onPageChange(pageIndex + 2); // pageIndex is 0-based, so pageIndex + 2 = next page number
    } else {
      table.nextPage();
    }
  };

  const handleLastPage = () => {
    if (useServerPagination) {
      onPageChange(pageCount);
    } else {
      table.setPageIndex(pageCount - 1);
    }
  };

  return (
    <div className="flex items-center space-x-6 lg:space-x-8">
      {!useServerPagination && (
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        Page {pageIndex + 1} of {pageCount}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={handleFirstPage}
          disabled={!canPreviousPage}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handlePreviousPage}
          disabled={!canPreviousPage}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handleNextPage}
          disabled={!canNextPage}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={handleLastPage}
          disabled={!canNextPage}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
