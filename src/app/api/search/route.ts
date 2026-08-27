// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { metalServerApi } from '@/lib/metal-api';
import type { Band } from '@/types/api'; // ✅ Import direct depuis le fichier de types

// Utilisation du Edge Runtime pour des réponses ultra-rapides
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const genre = searchParams.get('genre');

  try {
    // On utilise explicitement le type Band[] ici
    let results: Band[] = [];
    
    if (q) {
      results = await metalServerApi.searchBands(q);
    } else if (genre) {
      results = await metalServerApi.getBandsByGenre(genre);
    }
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
