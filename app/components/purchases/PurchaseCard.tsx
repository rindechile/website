"use client";

import type { Purchase } from "./columns";
import { ExcessBadge } from "./ExcessBadge";
import { PMABadge } from "./PMABadge";
import { ExternalLink } from "lucide-react";

interface PurchaseCardProps {
  purchase: Purchase;
  animationDelay?: number;
}

const formatPrice = (price: number | null): string => {
  if (price === null) return "N/A";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatQuantity = (quantity: number): string => {
  return new Intl.NumberFormat("es-CL").format(quantity);
};

const toSentenceCase = (text: string): string => {
  return text.toLowerCase().charAt(0).toUpperCase() + text.toLowerCase().slice(1);
};

export function PurchaseCard({ purchase, animationDelay = 0 }: PurchaseCardProps) {
  const handleClick = () => {
    window.open(
      `https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx?codigoOC=${purchase.chilecompra_code}`,
      "_blank"
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de compra: ${purchase.item_name}. Abre en nueva pestaña.`}
      className="bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all animate-fade-in-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header: Item Name + ExcessBadge */}
      <div className="flex flex-row items-start justify-between gap-3 px-4 py-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-base text-wrap max-w-[200px] leading-tight line-clamp-2">
            {toSentenceCase(purchase.item_name)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {purchase.municipality_name}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col gap-1 items-end">
          <ExcessBadge
            percentage={purchase.price_excess_percentage}
            maxAcceptablePrice={purchase.max_acceptable_price}
            variant="compact"
          />
          <PMABadge maxAcceptablePrice={purchase.max_acceptable_price} />
        </div>
      </div>

      {/* Body: Price Grid */}
      <div className="grid grid-cols-3 gap-4 px-4 py-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Cantidad</p>
          <p className="text-sm font-medium">{formatQuantity(purchase.quantity)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Precio Unitario</p>
          <p className="text-sm font-medium">{formatPrice(purchase.unit_total_price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Precio Total</p>
          <p className="text-sm font-medium">{formatPrice(purchase.total_price)}</p>
        </div>
      </div>

      {/* Footer: ChileCompra Code */}
      <div className="flex items-center justify-between px-4 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground font-mono">
          ID: {purchase.chilecompra_code}
        </p>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
