import type { Table } from "@tanstack/react-table";

interface TableStatusProps<TData> {
  table: Table<TData>;
}

export function TableStatus<TData>({ table }: TableStatusProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;

  if (totalRows === 0) {
    return (
      <div className="flex-1 text-sm text-muted-foreground">
        No rows to display
      </div>
    );
  }

  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex-1 text-sm text-muted-foreground">
      Showing <span className="font-medium">{startRow}</span> to{" "}
      <span className="font-medium">{endRow}</span> of{" "}
      <span className="font-medium">{totalRows}</span>{" "}
      {totalRows === 1 ? "row" : "rows"}
    </div>
  );
}
