import { Suspense } from 'react';
import type { Metadata } from 'next';
import { metalServerApi } from '@/lib/metal-api';
import SearchResultsClient from '@/components/search/SearchResultsClient';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════
// PARAMS (Next.js 15)
// ═══════════════════════════════════════════
interface Props {
  params: Promise<{ query: string }>;
}

// ═══════════════════════════════════════════
// METADATA DYNAMIQUE
// ═══════════════════════════════════════════
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);

  return {
    title: `Recherche : "${decodedQuery}"`,
    description: `Résultats de recherche pour "${decodedQuery}" sur MetalPedia`,
    robots: {
      index: false, // Ne pas indexer les pages de recherche
      follow: true,
    },
  };
}

// ═══════════════════════════════════════════
// PAGE DE RECHERCHE
// ═══════════════════════════════════════════
export default async function SearchPage({ params }: Props) {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);

  return (
    <div className="space-y-6">
      <header className="border-b border-metal-gray pb-6">
        <h1 className="font-metal text-4xl md:text-5xl text-metal-rust mb-2">
          🔍 Résultats de recherche
        </h1>
        <p className="text-gray-400">
          Recherche pour : <span className="text-metal-fire font-semibold">« {decodedQuery} »</span>
        </p>
      </header>

      <Suspense fallback={<Loader text="Recherche dans les ténèbres..." />}>
        <SearchResultsClient query={decodedQuery} />
      </Suspense>
    </div>
  );
}
