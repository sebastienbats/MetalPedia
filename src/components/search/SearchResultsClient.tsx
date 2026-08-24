'use client';

import { useSearchParams } from 'next/navigation';
import { useSearchBands } from '@/api/hooks';
import BandGrid from '@/components/bands/BandGrid';
import Link from 'next/link';

interface Props {
  query: string;
}

export default function SearchResultsClient({ query }: Props) {
  const { data: bands, isLoading, error } = useSearchBands(query);

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-400 mb-4">Erreur lors de la recherche</p>
        <Link href="/" className="metal-button">
          ← Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (!isLoading && bands?.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💀</div>
        <p className="text-xl text-gray-400 mb-2">
          Aucun groupe trouvé pour « {query} »
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Essayez une autre recherche ou explorez par genre depuis l'accueil.
        </p>
        <Link href="/" className="metal-button">
          🎸 Explorer par genre
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isLoading && bands && bands.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {bands.length} résultat{bands.length > 1 ? 's' : ''} trouvé{bands.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      <BandGrid bands={bands || []} isLoading={isLoading} />
    </div>
  );
}
