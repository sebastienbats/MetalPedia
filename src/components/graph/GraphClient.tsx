'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useSimilarBands } from '@/api/hooks';
import type { Genre, Recommendation } from '@/types/api';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════════════════════
// IMPORT DYNAMIQUE DU GRAPHE D3 (client-only)
// ═══════════════════════════════════════════════════════════
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
    band_id: number;
    name: string;
    genre: Genre;
    country: string;
  };
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function GraphClient({ sourceBand }: Props) {
  // ✅ Nouveau hook Last.fm (prend seulement bandId)
  const { data, isLoading, error } = useSimilarBands(sourceBand.band_id);

  // ═══════════════════════════════════════════════════════════
  // TRANSFORMATION : SimilarBand[] (Last.fm) → Recommendation[]
  // ═══════════════════════════════════════════════════════════
  // Last.fm retourne : { name, match, image_url, url }
  // SimilarityGraph attend : Recommendation { band_id, name, genre, country, similarity_score, image_url }
  const recommendations = useMemo<Recommendation[]>(() => {
    if (!data?.similar || data.similar.length === 0) return [];

    return data.similar.map((similarBand, index) => ({
      band_id: -(index + 1), // ID temporaire négatif (pas en DB locale)
      name: similarBand.name,
      genre: sourceBand.genre, // Hérite du genre source (approximation)
      genre_pillar: undefined, // Pas disponible via Last.fm
      country: 'Unknown', // Pas disponible via Last.fm
      similarity_score: similarBand.match, // Score 0-1 de Last.fm
      image_url: similarBand.image_url,
    }));
  }, [data, sourceBand.genre]);

  // ═══════════════════════════════════════════════════════════
  // ÉTAT DE CHARGEMENT
  // ═══════════════════════════════════════════════════════════
  if (isLoading) {
    return <Loader text="Analyse des similarités via Last.fm..." />;
  }

  // ═══════════════════════════════════════════════════════════
  // GESTION D'ERREUR
  // ═══════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <h3 className="font-serif text-xl mb-2 text-metal-rust">
          Analyse indisponible
        </h3>
        <p className="text-gray-400 mb-4">
          Impossible de récupérer les groupes similaires pour le moment.
        </p>
        <p className="text-sm text-gray-500">
          Le service Last.fm est peut-être temporairement indisponible.
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CAS : AUCUNE RECOMMANDATION
  // ═══════════════════════════════════════════════════════════
  if (recommendations.length === 0) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="font-serif text-xl mb-2 text-metal-rust">
          Aucun groupe similaire trouvé
        </h3>
        <p className="text-gray-400 mb-4">
          Last.fm n'a pas encore identifié de groupes similaires pour{' '}
          <span className="text-metal-fire font-semibold">{sourceBand.name}</span>.
        </p>
        <p className="text-sm text-gray-500">
          Essaye avec un groupe plus connu ou reviens plus tard.
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDU DU GRAPHE
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Indicateur de source */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>🎯</span>
        <span>
          {recommendations.length} groupe{recommendations.length > 1 ? 's' : ''} similaire
          {recommendations.length > 1 ? 's' : ''} • Source : Last.fm
        </span>
      </div>

      {/* Graphe interactif */}
      <SimilarityGraph
        sourceBand={{
          id: sourceBand.band_id,
          name: sourceBand.name,
          genre: sourceBand.genre,
          country: sourceBand.country,
        }}
        recommendations={recommendations}
        height={600}
      />
    </div>
  );
}
