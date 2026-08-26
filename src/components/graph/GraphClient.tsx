'use client';

import dynamic from 'next/dynamic';
import { useSimilarBands } from '@/api/spotify';
import type { Genre } from '@/types/api';
import Loader from '@/components/ui/Loader';

// Import dynamique du graphe D3 (client-only)
const SimilarityGraph = dynamic(
  () => import('@/components/visual/SimilarityGraph'),
  {
    ssr: false,
    loading: () => <Loader text="Initialisation du graphe..." />,
  }
);

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════

interface Props {
  sourceBand: {
    band_id: number;  // ✅ Changé de 'id' à 'band_id'
    name: string;
    genre: Genre;
    country: string;
  };
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function GraphClient({ sourceBand }: Props) {
  const { data: recommendations, isLoading, error } = useSimilarBands(sourceBand, 15);

  if (isLoading) {
    return <Loader text="Analyse des similarités par le moteur ML..." />;
  }

  if (error) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-400">
          Erreur lors de la récupération des recommandations.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Vérifiez que le ML Service est démarré sur le port 8000.
        </p>
      </div>
    );
  }

  return (
    <SimilarityGraph
      sourceBand={{
        id: sourceBand.band_id,  // ✅ Map 'band_id' vers 'id' pour SimilarityGraph
        name: sourceBand.name,
        genre: sourceBand.genre,
        country: sourceBand.country,
      }}
      recommendations={recommendations || []}
      height={600}
    />
  );
}
