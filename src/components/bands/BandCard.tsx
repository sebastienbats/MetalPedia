'use client';

import Link from 'next/link';
import type { BandSearchResult } from '@/types/api';

export default function BandCard({ band }: { band: BandSearchResult }) {
  return (
    <Link href={`/band/${band.id}`} className="metal-card group block p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-serif font-bold text-xl group-hover:text-metal-fire transition-colors line-clamp-1">
          {band.name}
        </h3>
        <span className="text-xs px-2 py-1 bg-metal-blood/30 border border-metal-blood rounded whitespace-nowrap">
          {band.country}
        </span>
      </div>
      <p className="text-sm text-gray-400 line-clamp-2 italic">{band.genre}</p>
    </Link>
  );
}
