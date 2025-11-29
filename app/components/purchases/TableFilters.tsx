import { Button } from "@/app/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { ChevronsUpDown, X } from "lucide-react";
import { TableCombobox } from "./TableCombobox";
import type { Table } from "@tanstack/react-table";
import type { FilterOptions } from "./PurchasesTable";

interface TableFiltersProps<TData> {
  table: Table<TData>;
  filterOptions: FilterOptions;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TableFilters<TData>({
  table,
  filterOptions,
  isOpen,
  onOpenChange,
}: TableFiltersProps<TData>) {
  const columnFilters = table.getState().columnFilters;
  const hasActiveFilters = columnFilters.length > 0;

  const clearAllFilters = () => {
    table.setColumnFilters([]);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="space-y-2">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              Filters
              {hasActiveFilters && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({columnFilters.length} active)
                </span>
              )}
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="h-8 px-2 lg:px-3"
              >
                Clear all
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0" />
          <span className="sr-only">Toggle filters</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <TableCombobox
            options={filterOptions.items}
            value={(table.getColumn("item_name")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) =>
              table.getColumn("item_name")?.setFilterValue(value)
            }
            placeholder="Filter by item..."
            searchPlaceholder="Search items..."
            emptyText="No item found."
          />
          <TableCombobox
            options={filterOptions.municipalities}
            value={(table.getColumn("municipality_name")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) =>
              table.getColumn("municipality_name")?.setFilterValue(value)
            }
            placeholder="Filter by municipality..."
            searchPlaceholder="Search municipalities..."
            emptyText="No municipality found."
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
