import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { municipalities, regions, purchases } from '@/schemas/drizzle';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const municipalityId = parseInt(id, 10);

    if (isNaN(municipalityId)) {
      return NextResponse.json(
        { error: 'Invalid municipality ID' },
        { status: 400 }
      );
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB);

    // Fetch municipality with region name
    const municipality = await db
      .select({
        id: municipalities.id,
        name: municipalities.name,
        region_id: municipalities.region_id,
        region_name: regions.name,
        budget: municipalities.budget,
        budget_per_capita: municipalities.budget_per_capita,
      })
      .from(municipalities)
      .innerJoin(regions, eq(municipalities.region_id, regions.id))
      .where(eq(municipalities.id, municipalityId))
      .get();

    if (!municipality) {
      return NextResponse.json(
        { error: 'Municipality not found' },
        { status: 404 }
      );
    }

    // Compute overpricing stats from purchases
    const stats = await db
      .select({
        compras_totales: sql<number>`COUNT(*)`,
        compras_caras: sql<number>`SUM(CASE WHEN ${purchases.is_expensive} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(purchases)
      .where(eq(purchases.municipality_id, municipalityId))
      .get();

    const compras_totales = stats?.compras_totales || 0;
    const compras_caras = stats?.compras_caras || 0;
    const porcentaje_sobreprecio =
      compras_totales > 0 ? (compras_caras / compras_totales) * 100 : 0;

    return NextResponse.json({
      ...municipality,
      porcentaje_sobreprecio,
      compras_caras,
      compras_totales,
    });
  } catch (error) {
    console.error('Error fetching municipality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch municipality' },
      { status: 500 }
    );
  }
}
