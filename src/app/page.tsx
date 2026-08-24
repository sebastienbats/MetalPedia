'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBandsByGenre } from '@/api/hooks';
import BandGrid from '@/components/bands/BandGrid';
import StatsPanel from '@/components/visual/StatsPanel';
import { Suspense } from 'react';

const GENRES = [
  { label: '🎸 Black Metal', value: 'Black Metal' },
  { label: '💀 Death Metal', value: 'Death Metal' },
  { label: '🔥 Heavy Metal', value: 'Heavy Metal' },
  { label: '⚡ Thrash Metal', value: 'Thrash Metal' },
  { label: '🎻 Power Metal', value: 'Power Metal' },
  { label: '🌑 Doom Metal', value: 'Doom Metal' },
  { label: '🎼 Progressive Metal', value: 'Progressive Metal' },
  { label: '⚔️ Folk Metal', value: 'Folk Metal' },
];

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'Heavy Metal';
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const { data: bands, isLoading, error } = useBandsByGenre(selectedGenre);

  return (
    <div className="space-y-8">
      <section className="text-center py-8 md:py-12 border-b border-metal-gray">
        <h2 className="font-metal text-5xl md:text-7xl text-metal-rust mb-4 leading-none">
          Bienvenue dans les ténèbres
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-serif">
          Explorez plus de 170 000 groupes de metal à travers le monde.
        </p>
      </section>

      <section className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.value}
                onClick={() => setSelectedGenre(genre.value)}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  selectedGenre === genre.value
                    ? 'bg-gradient-to-r from-metal-blood to-metal-rust text-white shadow-lg'
                    : 'bg-metal-dark border border-metal-gray text-gray-300 hover:border-metal-fire'
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">⚠️</p>
              <p className="text-red-400">{(error as Error).message}</p>
            </div>
          ) : (
            <BandGrid bands={bands || []} isLoading={isLoading} />
          )}
        </div>

        <aside className="space-y-6">
          <StatsPanel />
        </aside>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Chargement...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
