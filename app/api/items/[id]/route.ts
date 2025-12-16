import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import {
  items,
  commodities,
  classes,
  families,
  segments,
  categories,
  purchases,
  suppliers,
  municipalities,
  regions,
} from '@/schemas/drizzle';
import type { ItemDetailResponse, ItemDetail, ItemSupplier, ItemRegionStats } from '@/types/items';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ItemDetailResponse>> {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const { env } = getCloudflareContext();
    if (!env.DB) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    const db = drizzle(env.DB);

    // Fetch item with full UNSPSC hierarchy
    const itemResult = await db
      .select({
        id: items.id,
        name: items.name,
        expectedMinRange: items.expected_min_range,
        expectedMaxRange: items.expected_max_range,
        maxAcceptablePrice: items.max_acceptable_price,
        hasSufficientData: items.has_sufficient_data,
        commodityId: commodities.id,
        commodityName: commodities.name,
        classId: classes.id,
        className: classes.name,
        familyId: families.id,
        familyName: families.name,
        segmentId: segments.id,
        segmentName: segments.name,
        categoryId: categories.id,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(commodities, eq(items.commodity_id, commodities.id))
      .leftJoin(classes, eq(commodities.class_id, classes.id))
      .leftJoin(families, eq(classes.family_id, families.id))
      .leftJoin(segments, eq(families.segment_id, segments.id))
      .leftJoin(categories, eq(segments.category_id, categories.id))
      .where(eq(items.id, itemId))
      .get();

    if (!itemResult) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Fetch purchase statistics
    const statsResult = await db
      .select({
        totalPurchases: sql<number>`COUNT(*)`,
        overpricedPurchases: sql<number>`SUM(CASE WHEN ${purchases.is_expensive} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(purchases)
      .where(eq(purchases.item_id, itemId))
      .get();

    const totalPurchases = statsResult?.totalPurchases || 0;
    const overpricedPurchases = statsResult?.overpricedPurchases || 0;
    const overpricingRate = totalPurchases > 0
      ? (overpricedPurchases / totalPurchases) * 100
      : 0;

    // Fetch suppliers data with regions
    const suppliersResult = await db
      .select({
        rut: suppliers.rut,
        name: suppliers.name,
        size: suppliers.size,
        purchaseCount: sql<number>`COUNT(*)`,
        totalQuantity: sql<number>`SUM(${purchases.quantity})`,
        avgPrice: sql<number>`AVG(${purchases.unit_total_price})`,
        regionNames: sql<string>`GROUP_CONCAT(DISTINCT ${regions.name})`,
      })
      .from(purchases)
      .innerJoin(suppliers, eq(purchases.supplier_rut, suppliers.rut))
      .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
      .innerJoin(regions, eq(municipalities.region_id, regions.id))
      .where(eq(purchases.item_id, itemId))
      .groupBy(suppliers.rut)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(50)
      .all();

    // Fetch regional statistics
    const regionsResult = await db
      .select({
        regionId: regions.id,
        regionName: regions.name,
        purchaseCount: sql<number>`COUNT(*)`,
        totalQuantity: sql<number>`SUM(${purchases.quantity})`,
        avgPrice: sql<number>`AVG(${purchases.unit_total_price})`,
        overpricedCount: sql<number>`SUM(CASE WHEN ${purchases.is_expensive} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(purchases)
      .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
      .innerJoin(regions, eq(municipalities.region_id, regions.id))
      .where(eq(purchases.item_id, itemId))
      .groupBy(regions.id)
      .orderBy(sql`COUNT(*) DESC`)
      .all();

    // Build response
    const item: ItemDetail = {
      id: itemResult.id,
      name: itemResult.name,
      expectedMinRange: itemResult.expectedMinRange,
      expectedMaxRange: itemResult.expectedMaxRange,
      maxAcceptablePrice: itemResult.maxAcceptablePrice,
      hasSufficientData: itemResult.hasSufficientData === 1,
      category: {
        commodityId: itemResult.commodityId,
        commodityName: itemResult.commodityName,
        classId: itemResult.classId,
        className: itemResult.className,
        familyId: itemResult.familyId,
        familyName: itemResult.familyName,
        segmentId: itemResult.segmentId,
        segmentName: itemResult.segmentName,
        categoryId: itemResult.categoryId,
        categoryName: itemResult.categoryName,
      },
      stats: {
        totalPurchases,
        overpricedPurchases,
        overpricingRate,
      },
    };

    const suppliersList: ItemSupplier[] = suppliersResult.map(s => ({
      rut: s.rut,
      name: s.name,
      size: s.size,
      purchaseCount: s.purchaseCount,
      totalQuantity: s.totalQuantity,
      averagePrice: s.avgPrice,
      regionNames: s.regionNames ? s.regionNames.split(',') : [],
    }));

    const regionsList: ItemRegionStats[] = regionsResult.map(r => ({
      regionId: r.regionId,
      regionName: r.regionName,
      purchaseCount: r.purchaseCount,
      totalQuantity: r.totalQuantity,
      averagePrice: r.avgPrice,
      overpricedCount: r.overpricedCount,
      overpricingRate: r.purchaseCount > 0
        ? (r.overpricedCount / r.purchaseCount) * 100
        : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        item,
        suppliers: suppliersList,
        regions: regionsList,
      },
    });
  } catch (error) {
    console.error('Error fetching item details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
