import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { purchases, municipalities, items, suppliers } from '@/schemas/drizzle';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const level = searchParams.get('level'); // 'country' | 'region' | 'municipality'
    const regionId = searchParams.get('regionId'); // region ID (1-16)
    const municipalityId = searchParams.get('municipalityId'); // municipality ID

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 1000) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Validate level parameter
    if (level && !['country', 'region', 'municipality'].includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid level parameter' },
        { status: 400 }
      );
    }

    // Access Cloudflare D1 database via context
    const { env } = getCloudflareContext();
    if (!env.DB) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    const db = drizzle(env.DB);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build query with joins to get related data
    let query = db
      .select({
        chilecompra_code: purchases.chilecompra_code,
        item_name: items.name,
        municipality_name: municipalities.name,
        supplier_name: suppliers.name,
        quantity: purchases.quantity,
        unit_total_price: purchases.unit_total_price,
        total_price: sql<number>`${purchases.quantity} * ${purchases.unit_total_price}`,
        price_excess_percentage: purchases.price_excess_percentage,
      })
      .from(purchases)
      .innerJoin(items, eq(purchases.item_id, items.id))
      .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
      .innerJoin(suppliers, eq(purchases.supplier_rut, suppliers.rut))
      .$dynamic();

    // Apply filters based on level
    if (level === 'municipality' && municipalityId) {
      query = query.where(eq(purchases.municipality_id, parseInt(municipalityId)));
    } else if (level === 'region' && regionId) {
      query = query.where(eq(municipalities.region_id, parseInt(regionId)));
    }
    // For 'country' level or no level specified, no filter is applied

    // Execute query with ordering, limit, and offset
    const results = await query
      .orderBy(desc(purchases.id))
      .limit(pageSize)
      .offset(offset)
      .all();

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        pageSize,
        hasMore: results.length === pageSize,
      },
      filter: {
        level: level || 'country',
        regionId,
        municipalityId,
      },
    });
  } catch (error) {
    console.error('Error fetching purchases data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
