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
    <div className="container mx-auto px-4 py-12 lg:py-16 space-y-12">
      <header className="border-b border-metal-gray pb-6">
        <h1 className="font-metal text-2xl lg:text-4xl text-metal-fire mb-8">
          🔍 Résultats de recherche
        </h1>
        <p className="text-metal-bone font-serif text-base lg:text-lg">
          Recherche pour : <span className="text-metal-fire font-semibold">« {decodedQuery} »</span>
        </p>
      </header>

      <Suspense fallback={<Loader text="Recherche dans les ténèbres..." />}>
        <SearchResultsClient query={decodedQuery} />
      </Suspense>
    </div>
  );
}
