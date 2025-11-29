"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Purchase = {
  chilecompra_code: string;
  item_name: string;
  municipality_name: string;
  supplier_name: string;
  quantity: number;
  unit_total_price: number | null;
  total_price: number | null;
  price_excess_percentage: number | null;
};

export const columns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "chilecompra_code",
    header: "ChileCompra Code",
  },
  {
    accessorKey: "item_name",
    header: "Item Name",
  },
  {
    accessorKey: "municipality_name",
    header: "Municipality Name",
  },
  {
    accessorKey: "supplier_name",
    header: "Supplier Name",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      return new Intl.NumberFormat("es-CL").format(quantity);
    },
  },
  {
    accessorKey: "unit_total_price",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("unit_total_price") as number | null;
      if (price === null) return "N/A";
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    },
  },
  {
    accessorKey: "total_price",
    header: "Total Price",
    cell: ({ row }) => {
      const price = row.getValue("total_price") as number | null;
      if (price === null) return "N/A";
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    },
  },
  {
    accessorKey: "price_excess_percentage",
    header: "Excess %",
    cell: ({ row }) => {
      const percentage = row.getValue("price_excess_percentage") as number | null;
      if (percentage === null) return "N/A";
      return `${percentage.toFixed(2)}%`;
    },
  },
];
