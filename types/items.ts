// Item search result for autocomplete
export interface ItemSearchResult {
  id: number;
  name: string;
  commodityName: string | null;
  hasSufficientData: boolean;
}

// UNSPSC category hierarchy
export interface ItemCategory {
  commodityId: number | null;
  commodityName: string | null;
  classId: number | null;
  className: string | null;
  familyId: number | null;
  familyName: string | null;
  segmentId: number | null;
  segmentName: string | null;
  categoryId: number | null;
  categoryName: string | null;
}

// Purchase statistics for an item
export interface ItemStats {
  totalPurchases: number;
  overpricedPurchases: number;
  overpricingRate: number;
}

// Full item detail with all insights
export interface ItemDetail {
  id: number;
  name: string;
  expectedMinRange: number | null;
  expectedMaxRange: number | null;
  maxAcceptablePrice: number | null;
  hasSufficientData: boolean;
  category: ItemCategory;
  stats: ItemStats;
}

// Supplier summary for an item
export interface ItemSupplier {
  rut: string;
  name: string | null;
  size: string | null;
  purchaseCount: number;
  totalQuantity: number;
  averagePrice: number;
  regionNames: string[];
}

// Regional purchase statistics for an item
export interface ItemRegionStats {
  regionId: number;
  regionName: string;
  purchaseCount: number;
  totalQuantity: number;
  averagePrice: number;
  overpricedCount: number;
  overpricingRate: number;
}

// API Response types
export interface ItemSearchResponse {
  success: boolean;
  data?: ItemSearchResult[];
  error?: string;
}

export interface ItemDetailResponse {
  success: boolean;
  data?: {
    item: ItemDetail;
    suppliers: ItemSupplier[];
    regions: ItemRegionStats[];
  };
  error?: string;
}
