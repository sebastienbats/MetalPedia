import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { metalServerApi } from '@/lib/metal-api';
import GraphClient from '@/components/graph/GraphClient';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════════════════════
// PARAMS (Next.js 15)
// ═══════════════════════════════════════════════════════════
interface Props {
  params: Promise<{ bandId: string }>;
}

// ═══════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bandId } = await params;

  try {
    const band = await metalServerApi.getBand(parseInt(bandId, 10));
    if (!band) return { title: 'Graphe introuvable' };

    return {
      title: `Graphe de similarité — ${band.name}`,
      description: `Découvrez les groupes similaires à ${band.name} grâce à notre moteur de recommandations ML.`,
    };
  } catch {
    return { title: 'Graphe de similarité — MetalPedia' };
  }
}

// ═══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════
export default async function GraphPage({ params }: Props) {
  const { bandId } = await params;
  const id = parseInt(bandId, 10);

  if (isNaN(id) || id <= 0) {
    notFound();
  }

  try {
    const band = await metalServerApi.getBand(id);

    if (!band) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <header className="border-b border-metal-gray pb-6">
          <h1 className="font-metal text-4xl md:text-5xl text-metal-rust mb-2">
            🕸️ Graphe de similarité
          </h1>
          <p className="text-gray-400">
            Groupes similaires à{' '}
            <span className="text-metal-fire font-semibold">{band.name}</span>
            {' '}propulsé par notre moteur ML
          </p>
        </header>

        <Suspense fallback={<Loader text="Construction du graphe..." />}>
          <GraphClient
            sourceBand={{
              band_id: band.id,  // ✅ Passé comme 'band_id' (au lieu de 'id')
              name: band.name,
              genre: band.genre,
              country: band.country,
            }}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error(`Error loading graph for band ${id}:`, error);
    notFound();
  }
}
