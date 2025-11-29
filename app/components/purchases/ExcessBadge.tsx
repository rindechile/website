"use client";

type ExcessBadgeProps = {
  percentage: number | null;
  expectedMinRange: number | null;
  expectedMaxRange: number | null;
};

export function ExcessBadge({ percentage, expectedMinRange, expectedMaxRange }: ExcessBadgeProps) {
  // If no percentage or no price range data, show N/A
  if (percentage === null || expectedMinRange === null || expectedMaxRange === null) {
    return <div className="font-light text-muted-foreground">N/A</div>;
  }

  // Determine color based on excess percentage tiers
  // bajo (low): 0-20% -> tier-bajo color
  // medio (medium): 20-50% -> tier-medio color
  // alto (high): 50%+ -> tier-alto color
  const getTierColor = (percent: number) => {
    if (percent <= 20) {
      return "bg-[var(--tier-bajo)] text-[var(--tier-alto)]";
    } else if (percent <= 50) {
      return "bg-[var(--tier-medio)] text-[var(--tier-bajo)]";
    } else {
      return "bg-[var(--tier-alto-var)] text-[var(--tier-bajo)]";
    }
  };

  const colorClass = getTierColor(percentage);

  // Format price range for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const priceRange = `${formatPrice(expectedMinRange)} - ${formatPrice(expectedMaxRange)}`;

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}>
        +{percentage.toFixed(1)}%
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        Rango Esperado: {priceRange}
      </div>
    </div>
  );
}
