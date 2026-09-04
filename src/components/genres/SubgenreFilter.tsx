'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { SubgenreStats } from '@/types/api';

interface Props {
  pillar: string;
  subgenres: SubgenreStats[];
}

export default function SubgenreFilter({ pillar, subgenres }: Props) {
  const searchParams = useSearchParams();
  const activeSubgenre = searchParams.get('subgenre');

  const totalCount = subgenres.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="metal-card p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">
        Filtrer par sous-genre
      </h3>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/genres/${encodeURIComponent(pillar)}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !activeSubgenre
              ? 'bg-metal-fire text-white shadow-lg shadow-metal-fire/30'
              : 'bg-metal-gray/30 text-gray-300 hover:bg-metal-gray/50 border border-metal-gray/50'
          }`}
        >
          Tous ({totalCount})
        </Link>

        {subgenres.map((subgenre) => (
          <Link
            key={subgenre.name}
            href={`/genres/${encodeURIComponent(pillar)}?subgenre=${encodeURIComponent(subgenre.name)}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubgenre === subgenre.name
                ? 'bg-metal-fire text-white shadow-lg shadow-metal-fire/30'
                : 'bg-metal-gray/30 text-gray-300 hover:bg-metal-gray/50 border border-metal-gray/50'
            }`}
          >
            {subgenre.name} ({subgenre.count})
          </Link>
        ))}
      </div>
    </div>
  );
}
