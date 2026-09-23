import { NextRequest, NextResponse } from 'next/server';
import { metalServerApi } from '@/lib/metal-api';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const bandId = parseInt(id, 10);
    if (isNaN(bandId)) {
      return NextResponse.json({ error: 'Invalid band ID' }, { status: 400 });
    }

    // 🆕 Fetch parallèle : band + albums + members
    const [band, albums, members] = await Promise.all([
      metalServerApi.getBand(bandId),
      metalServerApi.getBandAlbums(bandId),
      metalServerApi.getBandMembers(bandId),
    ]);

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // 🆕 Retourne l'objet complet
    return NextResponse.json(
      { band, albums, members },
      {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to fetch band' }, { status: 502 });
  }
}
