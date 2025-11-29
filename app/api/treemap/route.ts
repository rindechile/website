import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import {
  purchases,
  items,
  commodities,
  classes,
  families,
  segments,
  municipalities,
  categories,
} from '@/schemas/drizzle';
import type { TreemapHierarchy, TreemapNode } from '@/types/map';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level'); // 'country' | 'region' | 'municipality'
    const code = searchParams.get('code'); // region ID or municipality ID
    const categoryId = searchParams.get('categoryId'); // Optional: for drilling down into segments
    const segmentId = searchParams.get('segmentId'); // Optional: for drilling down into families
    const familyId = searchParams.get('familyId'); // Optional: for drilling down into classes

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

    // Determine drill-down level based on parameters
    if (familyId) {
      // Drill down to classes
      if (level === 'country') {
        data = await getCountryClassesData(db, parseInt(familyId));
      } else if (level === 'region') {
        data = await getRegionClassesData(db, code!, parseInt(familyId));
      } else {
        data = await getMunicipalityClassesData(db, parseInt(code!), parseInt(familyId));
      }
    } else if (segmentId) {
      // Drill down to families
      if (level === 'country') {
        data = await getCountryFamiliesData(db, parseInt(segmentId));
      } else if (level === 'region') {
        data = await getRegionFamiliesData(db, code!, parseInt(segmentId));
      } else {
        data = await getMunicipalityFamiliesData(db, parseInt(code!), parseInt(segmentId));
      }
    } else if (categoryId) {
      // Drill down to segments
      if (level === 'country') {
        data = await getCountrySegmentsData(db, parseInt(categoryId));
      } else if (level === 'region') {
        data = await getRegionSegmentsData(db, code!, parseInt(categoryId));
      } else {
        data = await getMunicipalitySegmentsData(db, parseInt(code!), parseInt(categoryId));
      }
    } else {
      // Default: show categories
      if (level === 'country') {
        data = await getCountryTreemapData(db);
      } else if (level === 'region') {
        data = await getRegionTreemapData(db, code!);
      } else {
        // municipality level
        data = await getMunicipalityTreemapData(db, parseInt(code!));
      }
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
  // Query all purchases across the entire country, grouped by category only
  // New schema: purchases -> items -> commodities -> classes -> families -> segments -> categories
  const results = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .innerJoin(categories, eq(segments.category_id, categories.id))
    .groupBy(categories.id, categories.name)
    .all();

  return buildHierarchy(results, 'Chile');
}

async function getRegionTreemapData(db: ReturnType<typeof drizzle>, regionId: string): Promise<TreemapHierarchy> {
  // Query all purchases for municipalities in this region, grouped by category only
  const results = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .innerJoin(categories, eq(segments.category_id, categories.id))
    .where(eq(municipalities.region_id, parseInt(regionId)))
    .groupBy(categories.id, categories.name)
    .all();

  return buildHierarchy(results, `Region ${regionId}`);
}

async function getMunicipalityTreemapData(db: ReturnType<typeof drizzle>, municipalityCode: number): Promise<TreemapHierarchy> {
  // Query all purchases for this municipality, grouped by category only
  // municipalityCode is the cod_comuna from GeoJSON, which should match municipality_id in purchases
  const results = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .innerJoin(categories, eq(segments.category_id, categories.id))
    .where(eq(purchases.municipality_id, municipalityCode))
    .groupBy(categories.id, categories.name)
    .all();

  return buildHierarchy(results, `Municipality ${municipalityCode}`);
}

// Segment-level queries (drill-down from category)

async function getCountrySegmentsData(db: ReturnType<typeof drizzle>, categoryId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific category, grouped by segment
  const results = await db
    .select({
      segmentId: segments.id,
      segmentName: segments.name,
      categoryName: categories.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .innerJoin(categories, eq(segments.category_id, categories.id))
    .where(eq(categories.id, categoryId))
    .groupBy(segments.id, segments.name, categories.name)
    .all();

  return buildSegmentHierarchy(results, results[0]?.categoryName || `Category ${categoryId}`);
}

async function getRegionSegmentsData(db: ReturnType<typeof drizzle>, regionId: string, categoryId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific category in a region, grouped by segment
  const results = await db
    .select({
      segmentId: segments.id,
      segmentName: segments.name,
      categoryName: categories.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .innerJoin(categories, eq(segments.category_id, categories.id))
    .where(sql`${municipalities.region_id} = ${parseInt(regionId)} AND ${categories.id} = ${categoryId}`)
    .groupBy(segments.id, segments.name, categories.name)
    .all();

  return buildSegmentHierarchy(results, results[0]?.categoryName || `Category ${categoryId}`);
}

async function getMunicipalitySegmentsData(db: ReturnType<typeof drizzle>, municipalityCode: number, categoryId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific category in a municipality, grouped by segment
  const results = await db
    .select({
      segmentId: segments.id,
      segmentName: segments.name,
      categoryName: categories.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .innerJoin(categories, eq(segments.category_id, categories.id))
    .where(sql`${purchases.municipality_id} = ${municipalityCode} AND ${categories.id} = ${categoryId}`)
    .groupBy(segments.id, segments.name, categories.name)
    .all();

  return buildSegmentHierarchy(results, results[0]?.categoryName || `Category ${categoryId}`);
}

// Family-level queries (drill-down from segment)

async function getCountryFamiliesData(db: ReturnType<typeof drizzle>, segmentId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific segment, grouped by family
  const results = await db
    .select({
      familyId: families.id,
      familyName: families.name,
      segmentName: segments.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .where(eq(segments.id, segmentId))
    .groupBy(families.id, families.name, segments.name)
    .all();

  return buildFamilyHierarchy(results, results[0]?.segmentName || `Segment ${segmentId}`);
}

async function getRegionFamiliesData(db: ReturnType<typeof drizzle>, regionId: string, segmentId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific segment in a region, grouped by family
  const results = await db
    .select({
      familyId: families.id,
      familyName: families.name,
      segmentName: segments.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .where(sql`${municipalities.region_id} = ${parseInt(regionId)} AND ${segments.id} = ${segmentId}`)
    .groupBy(families.id, families.name, segments.name)
    .all();

  return buildFamilyHierarchy(results, results[0]?.segmentName || `Segment ${segmentId}`);
}

async function getMunicipalityFamiliesData(db: ReturnType<typeof drizzle>, municipalityCode: number, segmentId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific segment in a municipality, grouped by family
  const results = await db
    .select({
      familyId: families.id,
      familyName: families.name,
      segmentName: segments.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .innerJoin(segments, eq(families.segment_id, segments.id))
    .where(sql`${purchases.municipality_id} = ${municipalityCode} AND ${segments.id} = ${segmentId}`)
    .groupBy(families.id, families.name, segments.name)
    .all();

  return buildFamilyHierarchy(results, results[0]?.segmentName || `Segment ${segmentId}`);
}

// Class-level queries (drill-down from family)

async function getCountryClassesData(db: ReturnType<typeof drizzle>, familyId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific family, grouped by class
  const results = await db
    .select({
      classId: classes.id,
      className: classes.name,
      familyName: families.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .where(eq(families.id, familyId))
    .groupBy(classes.id, classes.name, families.name)
    .all();

  return buildClassHierarchy(results, results[0]?.familyName || `Family ${familyId}`);
}

async function getRegionClassesData(db: ReturnType<typeof drizzle>, regionId: string, familyId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific family in a region, grouped by class
  const results = await db
    .select({
      classId: classes.id,
      className: classes.name,
      familyName: families.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .where(sql`${municipalities.region_id} = ${parseInt(regionId)} AND ${families.id} = ${familyId}`)
    .groupBy(classes.id, classes.name, families.name)
    .all();

  return buildClassHierarchy(results, results[0]?.familyName || `Family ${familyId}`);
}

async function getMunicipalityClassesData(db: ReturnType<typeof drizzle>, municipalityCode: number, familyId: number): Promise<TreemapHierarchy> {
  // Query all purchases for a specific family in a municipality, grouped by class
  const results = await db
    .select({
      classId: classes.id,
      className: classes.name,
      familyName: families.name,
      totalValue: sql<number>`SUM(${purchases.quantity} * ${purchases.unit_total_price})`,
    })
    .from(purchases)
    .innerJoin(items, eq(purchases.item_id, items.id))
    .innerJoin(commodities, eq(items.commodity_id, commodities.id))
    .innerJoin(classes, eq(commodities.class_id, classes.id))
    .innerJoin(families, eq(classes.family_id, families.id))
    .where(sql`${purchases.municipality_id} = ${municipalityCode} AND ${families.id} = ${familyId}`)
    .groupBy(classes.id, classes.name, families.name)
    .all();

  return buildClassHierarchy(results, results[0]?.familyName || `Family ${familyId}`);
}

interface QueryResult {
  categoryId: number;
  categoryName: string;
  totalValue: number;
}

interface SegmentQueryResult {
  segmentId: number;
  segmentName: string;
  categoryName: string;
  totalValue: number;
}

interface FamilyQueryResult {
  familyId: number;
  familyName: string;
  segmentName: string;
  totalValue: number;
}

interface ClassQueryResult {
  classId: number;
  className: string;
  familyName: string;
  totalValue: number;
}

function buildHierarchy(results: QueryResult[], name: string): TreemapHierarchy {
  // Build simple structure with categories only
  const children: TreemapNode[] = results.map(row => ({
    id: row.categoryId,
    name: row.categoryName,
    value: row.totalValue,
    overpricingRate: 0, // Not used for spending visualization
    type: 'category',
  }));

  return {
    name,
    children,
  };
}

function buildSegmentHierarchy(results: SegmentQueryResult[], name: string): TreemapHierarchy {
  // Build structure with segments for a specific category
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

function buildFamilyHierarchy(results: FamilyQueryResult[], name: string): TreemapHierarchy {
  // Build structure with families for a specific segment
  const children: TreemapNode[] = results.map(row => ({
    id: row.familyId,
    name: row.familyName,
    value: row.totalValue,
    overpricingRate: 0, // Not used for spending visualization
    type: 'family',
  }));

  return {
    name,
    children,
  };
}

function buildClassHierarchy(results: ClassQueryResult[], name: string): TreemapHierarchy {
  // Build structure with classes for a specific family
  const children: TreemapNode[] = results.map(row => ({
    id: row.classId,
    name: row.className,
    value: row.totalValue,
    overpricingRate: 0, // Not used for spending visualization
    type: 'class',
  }));

  return {
    name,
    children,
  };
}
