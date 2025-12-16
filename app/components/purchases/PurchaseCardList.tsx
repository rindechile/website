"use client";

import type { Purchase } from "./columns";
import { PurchaseCard } from "./PurchaseCard";

interface PurchaseCardListProps {
  purchases: Purchase[];
}

export function PurchaseCardList({ purchases }: PurchaseCardListProps) {
  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">No se han encontrado datos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {purchases.map((purchase, index) => (
        <PurchaseCard
          key={`${purchase.chilecompra_code}-${purchase.item_name}-${index}`}
          purchase={purchase}
          animationDelay={index * 50}
        />
      ))}
    </div>
  );
}
