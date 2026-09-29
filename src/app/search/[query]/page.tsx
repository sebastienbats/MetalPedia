import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchResultsClient from '@/components/search/SearchResultsClient';
import Loader from '@/components/ui/Loader';

interface Props {
  params: Promise<{ query: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);
  return {
    title: `Recherche : "${decodedQuery}"`,
    description: `Résultats de recherche pour "${decodedQuery}" sur MetalPedia`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ params }: Props) {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);

  return (
    // ✅ Mobile Full-Width
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12 space-y-4 sm:space-y-6">
      <header className="border-b border-metal-gray pb-4 sm:pb-6 text-center">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2 sm:mb-4">
          🔍 Résultats de recherche
        </h1>
        <p className="text-metal-bone font-serif text-sm sm:text-base">
          Recherche pour : <span className="text-metal-fire font-semibold">« {decodedQuery} »</span>
        </p>
      </header>

      <Suspense fallback={<Loader text="Recherche dans les ténèbres..." />}>
        <SearchResultsClient query={decodedQuery} />
      </Suspense>
    </div>
  );
}
