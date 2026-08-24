import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { metalServerApi } from '@/lib/metal-api';
import AudioClient from '@/components/audio/AudioClient';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════
// PARAMS
// ═══════════════════════════════════════════
interface Props {
  params: Promise<{ bandId: string }>;
}

// ═══════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bandId } = await params;

  try {
    const band = await metalServerApi.getBand(parseInt(bandId, 10));
    if (!band) return { title: 'Analyse audio introuvable' };

    return {
      title: `Analyse audio — ${band.name}`,
      description: `Empreinte audio de ${band.name} : BPM, énergie, valence et plus via Spotify.`,
    };
  } catch {
    return { title: 'Analyse audio — MetalPedia' };
  }
}

// ═══════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════
export default async function AudioPage({ params }: Props) {
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-metal text-4xl md:text-5xl text-metal-rust mb-2">
                🎧 Audio Lab
              </h1>
              <p className="text-gray-400">
                Analyse musicale de{' '}
                <span className="text-metal-fire font-semibold">{band.name}</span>
              </p>
            </div>
            <Link href={`/band/${band.id}`} className="metal-button">
              ← Retour à la fiche
            </Link>
          </div>
        </header>

        <Suspense fallback={<Loader text="Analyse audio en cours..." />}>
          <AudioClient bandName={band.name} bandId={band.id} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error(`Error loading audio for band ${id}:`, error);
    notFound();
  }
}
