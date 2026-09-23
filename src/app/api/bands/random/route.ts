import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════════
// 🎲 GROUPE ALÉATOIRE
// ═══════════════════════════════════════════════════════════
// Pas de cache : chaque lancer de dé doit être imprévisible
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Compteur ESTIMÉ (count=planned) : évite un COUNT(*) exact
    // coûteux sur 170k lignes (~10ms au lieu de ~300ms)
    const { count, error: countError } = await supabase
      .from('bands')
      .select('id', { count: 'planned', head: true });

    if (countError || !count) {
      return NextResponse.json({ error: 'Count failed' }, { status: 500 });
    }

    // Offset aléatoire dans la table
    const offset = Math.floor(Math.random() * count);

    const { data, error } = await supabase
      .from('bands')
      .select('id, name, genre, genre_pillar, image_url')
      .range(offset, offset)
      .limit(1);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (err) {
    console.error('[random-band]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
