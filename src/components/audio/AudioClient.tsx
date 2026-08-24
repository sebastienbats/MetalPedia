'use client';

import { useAudioFeatures } from '@/api/spotify';
import AudioRadar from '@/components/visual/AudioRadar';
import Loader from '@/components/ui/Loader';
import Link from 'next/link';

interface Props {
  bandName: string;
  bandId: number;
}

export default function AudioClient({ bandName, bandId }: Props) {
  const { data: features, isLoading, error } = useAudioFeatures(bandName);

  if (isLoading) {
    return <Loader text="Récupération des données Spotify..." />;
  }

  if (error || !features) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">🎵</div>
        <h3 className="font-serif text-xl mb-2">Groupe introuvable sur Spotify</h3>
        <p className="text-gray-400 mb-6">
          Ce groupe n'est pas disponible dans la base Spotify ou n'a pas de
          données audio analysables.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={`/band/${bandId}`} className="metal-button">
            ← Retour à la fiche
          </Link>
          <Link href={`/graph/${bandId}`} className="metal-button">
            🕸️ Voir le graphe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AudioRadar features={features} bandName={bandName} />

      {/* Actions supplémentaires */}
      <div className="metal-card p-5">
        <h3 className="font-serif text-lg mb-3">🚀 Explorer plus</h3>
        <div className="flex flex-wrap gap-3">
          <Link href={`/band/${bandId}`} className="metal-button">
            📖 Fiche complète
          </Link>
          <Link href={`/graph/${bandId}`} className="metal-button">
            🕸️ Groupes similaires
          </Link>
        </div>
      </div>
    </div>
  );
}
