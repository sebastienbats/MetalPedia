'use client';

import BandCard from './BandCard';
import type { BandSearchResult } from '@/types/api';

interface Props { bands: BandSearchResult[]; isLoading: boolean; }

export default function BandGrid({ bands, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="metal-card p-5 animate-pulse">
            <div className="h-6 bg-metal-gray rounded mb-3 w-3/4" />
            <div className="h-4 bg-metal-gray rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (bands.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-6xl mb-4">💀</p>
        <p className="text-xl text-gray-400">Aucun groupe trouvé...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {bands.map((band) => <BandCard key={band.id} band={band} />)}
    </div>
  );
}
