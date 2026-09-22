'use client';

import AudioRadar from '@/components/visual/AudioRadar';
import Link from 'next/link';

interface Props {
  bandName: string;
  bandId: number;
}

export default function AudioClient({ bandName, bandId }: Props) {
  // ✅ AudioRadar gère son propre fetch via useAudioFeatures(bandId)
  // Grâce au fallback Last.fm, il ne peut JAMAIS échouer
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header narratif */}
      <div className="text-center">
        <h2 className="font-metal text-2xl sm:text-3xl text-metal-rust mb-2">
          🎵 Empreinte Sonore
        </h2>
        <p className="text-gray-400 font-serif text-sm sm:text-base">
          L'analyse acoustique de <span className="text-metal-fire font-semibold">{bandName}</span>
        </p>
      </div>

      {/* 🆕 AudioRadar avec bandId (fetch auto) */}
      <AudioRadar bandId={bandId} bandName={bandName} />

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
