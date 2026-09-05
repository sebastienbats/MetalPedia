// src/app/favorites/page.tsx
'use client';

import { useFavoriteBands, useFavoritesCount } from '@/stores/favoritesStore';
import BandCard from '@/components/bands/BandCard';
import Link from 'next/link';

export default function FavoritesPage() {
  const favorites = useFavoriteBands();
  const count = useFavoritesCount();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-metal text-4xl md:text-5xl text-metal-fire mb-2">
          ❤️ Mes Favoris
        </h1>
        <p className="text-gray-400 text-lg">
          {count} groupe{count > 1 ? 's' : ''} sauvegardé{count > 1 ? 's' : ''} dans ton Metalverse.
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      ) : (
        <div className="metal-card p-12 text-center border border-metal-gray">
          <div className="text-6xl mb-4">🎸</div>
          <h2 className="text-2xl font-bold text-gray-200 mb-2">Aucun favori pour le moment</h2>
          <p className="text-gray-400 mb-6">
            Explore l'encyclopédie et ajoute des groupes à ta collection personnelle.
          </p>
          <Link 
            href="/genres" 
            className="inline-block px-6 py-3 bg-metal-fire text-white rounded-lg font-semibold hover:bg-metal-fire/80 transition-colors"
          >
            Explorer les 9 Piliers du Metal
          </Link>
        </div>
      )}
    </div>
  );
}
