import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { purchases, municipalities, items } from '@/schemas/drizzle';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level'); // 'country' | 'region' | 'municipality'
    const regionId = searchParams.get('regionId'); // region ID (1-16)
    const municipalityId = searchParams.get('municipalityId'); // municipality ID

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

    // Build base query for items
    let itemsQuery = db
      .selectDistinct({
        name: items.name,
      })
      .from(purchases)
      .innerJoin(items, eq(purchases.item_id, items.id))
      .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
      .$dynamic();

    // Build base query for municipalities
    let municipalitiesQuery = db
      .selectDistinct({
        name: municipalities.name,
      })
      .from(purchases)
      .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
      .$dynamic();

    // Apply filters based on level
    if (level === 'municipality' && municipalityId) {
      const municipalityIdInt = parseInt(municipalityId);
      itemsQuery = itemsQuery.where(eq(purchases.municipality_id, municipalityIdInt));
      municipalitiesQuery = municipalitiesQuery.where(eq(purchases.municipality_id, municipalityIdInt));
    } else if (level === 'region' && regionId) {
      const regionIdInt = parseInt(regionId);
      itemsQuery = itemsQuery.where(eq(municipalities.region_id, regionIdInt));
      municipalitiesQuery = municipalitiesQuery.where(eq(municipalities.region_id, regionIdInt));
    }

    // Execute all queries in parallel
    const [itemsResults, municipalitiesResults] = await Promise.all([
      itemsQuery.orderBy(items.name).all(),
      municipalitiesQuery.orderBy(municipalities.name).all(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: itemsResults.map(r => r.name),
        municipalities: municipalitiesResults.map(r => r.name),
      },
      filter: {
        level: level || 'country',
        regionId,
        municipalityId,
      },
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
