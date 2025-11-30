"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ExcessBadge } from "./ExcessBadge";

export type Purchase = {
  chilecompra_code: string;
  item_name: string;
  municipality_name: string;
  quantity: number;
  unit_total_price: number | null;
  total_price: number | null;
  price_excess_percentage: number | null;
  max_acceptable_price: number | null;
};

export const columns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "chilecompra_code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="table"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="font-light">{row.getValue("chilecompra_code")}</div>;
    },
  },
  {
    accessorKey: "item_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="table"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre del Ítem
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const itemName = row.getValue("item_name") as string;
      const sentenceCase = itemName.toLowerCase().charAt(0).toUpperCase() + itemName.toLowerCase().slice(1);
      return <div className="font-light text-wrap min-w-[150px]">{sentenceCase}</div>;
    },
  },
  {
    accessorKey: "municipality_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="table"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
         Municipalidad
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const municipalityName = row.getValue("municipality_name") as string;
      return <div className="font-light text-wrap min-w-[150px]">{municipalityName}</div>;
    }
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="table"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cantidad
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      return <div className="font-light">{new Intl.NumberFormat("es-CL").format(quantity)}</div>;
    },
  },
  {
    accessorKey: "unit_total_price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="table"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Precio Unitario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("unit_total_price") as number | null;
      if (price === null) return <div className="font-light">N/A</div>;
      return <div className="font-light">{new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price)}</div>;
    },
  },
  {
    accessorKey: "total_price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="table"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Precio Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("total_price") as number | null;
      if (price === null) return <div className="font-light">N/A</div>;
      return <div className="font-light">{new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price)}</div>;
    },
  },
  {
    accessorKey: "price_excess_percentage",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="table"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Exceso
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const percentage = row.getValue("price_excess_percentage") as number | null;
      const maxAcceptablePrice = row.original.max_acceptable_price as number | null;
      return (
        <ExcessBadge
          percentage={percentage}
          maxAcceptablePrice={maxAcceptablePrice}
        />
      );
    },
  },
];
