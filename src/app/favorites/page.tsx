'use client';

import { useFavoriteBands, useFavoritesCount } from '@/stores/favoritesStore';
import BandCard from '@/components/bands/BandCard';
import Link from 'next/link';

export default function FavoritesPage() {
  const favorites = useFavoriteBands();
  const count = useFavoritesCount();

  return (
    // ✅ FIX : w-full px-2 au lieu de container mx-auto px-4 (supprime le double padding)
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12">
      <div className="mb-4 sm:mb-8 text-center">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2 sm:mb-4">
          ❤️ Mes Favoris
        </h1>
        <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg">
          {count} groupe{count > 1 ? 's' : ''} sauvegardé{count > 1 ? 's' : ''} dans ton Metalverse.
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {favorites.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      ) : (
        <div className="metal-card p-6 sm:p-8 text-center border border-metal-gray">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🎸</div>
          <h2 className="font-metal text-xl sm:text-3xl text-metal-fire mb-3 sm:mb-4">
            Aucun favori pour le moment
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
            Explore l'encyclopédie et ajoute des groupes à ta collection personnelle.
          </p>
          <Link 
            href="/genres" 
            className="inline-block px-6 py-3 bg-metal-fire text-white rounded-lg font-semibold hover:bg-metal-fire/80 transition-colors text-sm sm:text-base"
          >
            Explorer les 9 Piliers du Metal
          </Link>
        </div>
      )}
    </div>
  );
}
