import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { like, sql } from 'drizzle-orm';
import { items, commodities } from '@/schemas/drizzle';
import type { ItemSearchResponse } from '@/types/items';

export async function GET(request: NextRequest): Promise<NextResponse<ItemSearchResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '20', 10), 1), 50);

    // Require at least 2 characters for search
    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { env } = getCloudflareContext();
    if (!env.DB) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    const db = drizzle(env.DB);

    // Search items with LIKE, prioritizing prefix matches
    // Order by: exact prefix matches first, then contains matches
    const results = await db
      .select({
        id: items.id,
        name: items.name,
        commodityName: commodities.name,
        hasSufficientData: items.has_sufficient_data,
      })
      .from(items)
      .leftJoin(commodities, sql`${items.commodity_id} = ${commodities.id}`)
      .where(like(items.name, `%${query}%`))
      .orderBy(
        // Prioritize prefix matches
        sql`CASE WHEN ${items.name} LIKE ${query + '%'} THEN 0 ELSE 1 END`,
        items.name
      )
      .limit(limit)
      .all();

    return NextResponse.json({
      success: true,
      data: results.map(r => ({
        id: r.id,
        name: r.name,
        commodityName: r.commodityName,
        hasSufficientData: r.hasSufficientData === 1,
      })),
    });
  } catch (error) {
    console.error('Error searching items:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
