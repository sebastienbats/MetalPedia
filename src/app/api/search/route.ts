import { NextRequest, NextResponse } from 'next/server';
import { metalServerApi } from '@/lib/metal-api';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const genre = searchParams.get('genre');

  try {
    let results = [];
    if (q) {
      results = await metalServerApi.searchBands(q);
    } else if (genre) {
      results = await metalServerApi.getBandsByGenre(genre);
    }
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
