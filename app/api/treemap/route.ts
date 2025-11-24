import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import {
  purchases,
  commodities,
  classes,
  families,
  segments,
  municipalities,
} from '@/schemas/drizzle';
import type { TreemapHierarchy, TreemapNode } from '@/types/map';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level'); // 'country' | 'region' | 'municipality'
    const code = searchParams.get('code'); // region ID or municipality ID

    // Validate level parameter
    if (!level || !['country', 'region', 'municipality'].includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid level parameter' },
        { status: 400 }
      );
    }

    // For region and municipality, validate code parameter
    if (level !== 'country' && !code) {
      return NextResponse.json(
        { success: false, error: 'Code parameter required for region/municipality level' },
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

    let data: TreemapHierarchy;

    if (level === 'country') {
      data = await getCountryTreemapData(db);
    } else if (level === 'region') {
      data = await getRegionTreemapData(db, code!);
    } else {
      // municipality level
      data = await getMunicipalityTreemapData(db, parseInt(code!));
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching treemap data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function getCountryTreemapData(db: ReturnType<typeof drizzle>): Promise<TreemapHierarchy> {
  // Query all purchases across the entire country, grouped by segment
  const results = await db
    .select({
      segmentId: segments.id,
      segmentName: segments.name,
      totalValue: sql<number>`SUM(${purchases.amount} * ${purchases.unit_price})`,
    })
    .from(purchases)
    .innerJoin(commodities, eq(purchases.commodityId, commodities.id))
    .innerJoin(classes, eq(commodities.classId, classes.id))
    .innerJoin(families, eq(classes.familyId, families.id))
    .innerJoin(segments, eq(families.segmentId, segments.id))
    .groupBy(segments.id, segments.name)
    .all();

  return buildHierarchy(results, 'Chile');
}

async function getRegionTreemapData(db: ReturnType<typeof drizzle>, regionId: string): Promise<TreemapHierarchy> {
  // Query all purchases for municipalities in this region, grouped by segment only
  const results = await db
    .select({
      segmentId: segments.id,
      segmentName: segments.name,
      totalValue: sql<number>`SUM(${purchases.amount} * ${purchases.unit_price})`,
    })
    .from(purchases)
    .innerJoin(municipalities, eq(purchases.municipalityId, municipalities.id))
    .innerJoin(commodities, eq(purchases.commodityId, commodities.id))
    .innerJoin(classes, eq(commodities.classId, classes.id))
    .innerJoin(families, eq(classes.familyId, families.id))
    .innerJoin(segments, eq(families.segmentId, segments.id))
    .where(eq(municipalities.regionId, regionId))
    .groupBy(segments.id, segments.name)
    .all();

  return buildHierarchy(results, `Region ${regionId}`);
}

async function getMunicipalityTreemapData(db: ReturnType<typeof drizzle>, municipalityCode: number): Promise<TreemapHierarchy> {
  // Query all purchases for this municipality, grouped by segment only
  // municipalityCode is the cod_comuna from GeoJSON, which should match municipality_id in purchases
  const results = await db
    .select({
      segmentId: segments.id,
      segmentName: segments.name,
      totalValue: sql<number>`SUM(${purchases.amount} * ${purchases.unit_price})`,
    })
    .from(purchases)
    .innerJoin(commodities, eq(purchases.commodityId, commodities.id))
    .innerJoin(classes, eq(commodities.classId, classes.id))
    .innerJoin(families, eq(classes.familyId, families.id))
    .innerJoin(segments, eq(families.segmentId, segments.id))
    .where(eq(purchases.municipalityId, municipalityCode))
    .groupBy(segments.id, segments.name)
    .all();

  return buildHierarchy(results, `Municipality ${municipalityCode}`);
}

interface QueryResult {
  segmentId: string;
  segmentName: string;
  totalValue: number;
}

function buildHierarchy(results: QueryResult[], name: string): TreemapHierarchy {
  // Build simple structure with segments only
  const children: TreemapNode[] = results.map(row => ({
    id: row.segmentId,
    name: row.segmentName,
    value: row.totalValue,
    overpricingRate: 0, // Not used for spending visualization
    type: 'segment',
  }));

  return {
    name,
    children,
  };
}
