'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBandsByGenre } from '@/api/hooks';
import BandGrid from '@/components/bands/BandGrid';
import StatsPanel from '@/components/visual/StatsPanel';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import { Suspense } from 'react';

const GENRES = [
  { label: '🎸 Black Metal', value: 'Black Metal' },
  { label: '💀 Death Metal', value: 'Death Metal' },
  { label: '🔥 Heavy Metal', value: 'Heavy Metal' },
  { label: '⚡ Thrash Metal', value: 'Thrash Metal' },
  { label: '🎻 Power Metal', value: 'Power Metal' },
  { label: '🌑 Doom Metal', value: 'Doom Metal' },
];

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'Heavy Metal';
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const { data: bands, isLoading, error } = useBandsByGenre(selectedGenre);

  return (
    <div className="space-y-8">
      <section className="text-center py-8 border-b border-metal-gray">
        <h2 className="font-metal text-5xl md:text-7xl text-metal-rust mb-4">
          Bienvenue dans les ténèbres
        </h2>
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

          <BandGrid bands={bands || []} isLoading={isLoading} />
        </div>

        <aside className="space-y-6">
          <StatsPanel />
          <QuestsPanel />
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
