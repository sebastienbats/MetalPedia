import { NextRequest, NextResponse } from 'next/server';
import { metalServerApi } from '@/lib/metal-api';
import type { BandSearchResult } from '@/types/api';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const genre = searchParams.get('genre');

  try {
    // ✅ Typage explicite du tableau
    let results: BandSearchResult[] = [];
    
    if (q) {
      results = await metalServerApi.searchBands(q);
    } else if (genre) {
      results = await metalServerApi.getBandsByGenre(genre);
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
