'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useSimilarBands } from '@/api/hooks';
import type { Genre, Recommendation } from '@/types/api';
import Loader from '@/components/ui/Loader';

const SimilarityGraph = dynamic(
  () => import('@/components/visual/SimilarityGraph'),
  {
    ssr: false,
    loading: () => <Loader text="Initialisation du graphe..." />,
  }
);

interface Props {
  sourceBand: {
    band_id: number;
    name: string;
    genre: Genre;
    country: string;
  };
}

// 🆕 Type enrichi avec résolution Supabase
interface ResolvedSimilarBand {
  name: string;
  match: number;
  image_url: string | null;
  url: string | null;
  band_id: number | null;
  country?: string;
  genre?: string;
  is_cataloged: boolean;
}

export default function GraphClient({ sourceBand }: Props) {
  const { data, isLoading, error } = useSimilarBands(sourceBand.band_id);

  // 🆕 Transformation enrichie avec vrais IDs Supabase
  const { recommendations, stats } = useMemo(() => {
    if (!data?.similar || data.similar.length === 0) {
      return { recommendations: [] as Recommendation[], stats: { total: 0, cataloged: 0 } };
    }

    const similar = data.similar as ResolvedSimilarBand[];
    const cataloged = similar.filter(s => s.is_cataloged).length;

    const recommendations: Recommendation[] = similar.map((artist, index) => ({
      // ✅ Vrai ID Supabase si trouvé, sinon ID temporaire négatif
      band_id: artist.band_id ?? -(index + 1),
      name: artist.name,
      genre: artist.genre || sourceBand.genre,
      genre_pillar: undefined,
      country: artist.country || 'Unknown',
      similarity_score: artist.match,
      image_url: artist.image_url,
    }));

    return {
      recommendations,
      stats: { total: similar.length, cataloged },
    };
  }, [data, sourceBand.genre]);

  if (isLoading) {
    return <Loader text="Analyse des similarités via Last.fm..." />;
  }

  if (error) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <h3 className="font-serif text-xl mb-2 text-metal-rust">Analyse indisponible</h3>
        <p className="text-gray-400">Le service Last.fm est temporairement indisponible.</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="font-serif text-xl mb-2 text-metal-rust">Aucun groupe similaire</h3>
        <p className="text-gray-400">
          Last.fm n'a pas identifié de groupes similaires pour{' '}
          <span className="text-metal-fire font-semibold">{sourceBand.name}</span>.
        </p>
      </div>
    );
  }

  // 🆕 Pourcentage de couverture
  const coveragePercent = Math.round((stats.cataloged / stats.total) * 100);

  return (
    <div className="space-y-4">
      {/* 🆕 Indicateur de source + couverture DB */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <span>🎯</span>
          <span>{stats.total} groupes similaires</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-500">
          <span>📚</span>
          <span>
            <span className="text-metal-fire font-bold">{stats.cataloged}</span>
            /{stats.total} catalogués ({coveragePercent}%)
          </span>
        </div>

        <div 
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
          style={{
            color: '#d63031',
            borderColor: '#d6303160',
            backgroundColor: '#d6303115',
          }}
        >
          Source : Last.fm
        </div>
      </div>

      {/* 🆕 Légende des nœuds */}
      {stats.cataloged < stats.total && (
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-metal-fire"></span>
            <span>Catalogué (cliquable)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-600"></span>
            <span>Non catalogué</span>
          </div>
        </div>
      )}

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
