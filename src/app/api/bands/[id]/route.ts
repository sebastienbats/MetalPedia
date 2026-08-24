import { NextRequest, NextResponse } from 'next/server';
import { metalServerApi } from '@/lib/metal-api';

export const runtime = 'edge';
export const revalidate = 3600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const bandId = parseInt(id, 10);
    if (isNaN(bandId)) {
      return NextResponse.json({ error: 'Invalid band ID' }, { status: 400 });
    }

    const band = await metalServerApi.getBand(bandId);
    return NextResponse.json(band, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Band fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch band' }, { status: 502 });
  }
}
