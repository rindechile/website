import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { purchases, municipalities, items } from '@/schemas/drizzle';
import { desc, asc, eq, sql, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level'); // 'country' | 'region' | 'municipality'
    const regionId = searchParams.get('regionId'); // region ID (1-16)
    const municipalityId = searchParams.get('municipalityId'); // municipality ID

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 1000); // Max 1000 per page
    const offset = (page - 1) * limit;

    // Filtering parameters
    const itemNameFilter = searchParams.get('itemName');
    const municipalityNameFilter = searchParams.get('municipalityName');

    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'id'; // Default sort by ID
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // Default descending

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

    // Build query with joins to get related data
    let query = db
      .select({
        chilecompra_code: purchases.chilecompra_code,
        item_name: items.name,
        municipality_name: municipalities.name,
        quantity: purchases.quantity,
        unit_total_price: purchases.unit_total_price,
        total_price: sql<number>`${purchases.quantity} * ${purchases.unit_total_price}`,
        price_excess_percentage: purchases.price_excess_percentage,
        max_acceptable_price: items.max_acceptable_price,
      })
      .from(purchases)
      .innerJoin(items, eq(purchases.item_id, items.id))
      .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
      .$dynamic();

    // Build count query for pagination
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(purchases)
      .innerJoin(items, eq(purchases.item_id, items.id))
      .innerJoin(municipalities, eq(purchases.municipality_id, municipalities.id))
      .$dynamic();

    // Build WHERE conditions array
    const whereConditions = [];

    // Apply level-based filters
    if (level === 'municipality' && municipalityId) {
      whereConditions.push(eq(purchases.municipality_id, parseInt(municipalityId)));
    } else if (level === 'region' && regionId) {
      whereConditions.push(eq(municipalities.region_id, parseInt(regionId)));
    }

    // Apply column filters
    if (itemNameFilter) {
      whereConditions.push(eq(items.name, itemNameFilter));
    }
    if (municipalityNameFilter) {
      whereConditions.push(eq(municipalities.name, municipalityNameFilter));
    }

    // Apply WHERE conditions to both queries
    if (whereConditions.length > 0) {
      const combinedConditions = whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions);
      query = query.where(combinedConditions);
      countQuery = countQuery.where(combinedConditions);
    }

    // Apply sorting
    let orderByClause;
    const isAsc = sortOrder === 'asc';

    switch (sortBy) {
      case 'item_name':
        orderByClause = isAsc ? asc(items.name) : desc(items.name);
        break;
      case 'municipality_name':
        orderByClause = isAsc ? asc(municipalities.name) : desc(municipalities.name);
        break;
      case 'quantity':
        orderByClause = isAsc ? asc(purchases.quantity) : desc(purchases.quantity);
        break;
      case 'unit_total_price':
        orderByClause = isAsc ? asc(purchases.unit_total_price) : desc(purchases.unit_total_price);
        break;
      case 'total_price':
        orderByClause = isAsc
          ? asc(sql<number>`${purchases.quantity} * ${purchases.unit_total_price}`)
          : desc(sql<number>`${purchases.quantity} * ${purchases.unit_total_price}`);
        break;
      case 'price_excess_percentage':
        orderByClause = isAsc ? asc(purchases.price_excess_percentage) : desc(purchases.price_excess_percentage);
        break;
      default:
        orderByClause = desc(purchases.id);
    }

    // Execute both queries in parallel
    const [countResult, results] = await Promise.all([
      countQuery.get(),
      query
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset)
        .all()
    ]);

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
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
