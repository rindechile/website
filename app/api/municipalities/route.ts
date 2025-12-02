import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { municipalities, regions } from '@/schemas/drizzle';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const db = drizzle(env.DB);

    const result = await db
      .select({
        id: municipalities.id,
        name: municipalities.name,
        region_id: municipalities.region_id,
        region_name: regions.name,
      })
      .from(municipalities)
      .innerJoin(regions, eq(municipalities.region_id, regions.id))
      .orderBy(municipalities.name)
      .all();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch municipalities' },
      { status: 500 }
    );
  }
}
