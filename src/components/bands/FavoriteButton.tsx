// src/components/bands/FavoriteButton.tsx
'use client';

import { useFavoritesStore } from '@/stores/favoritesStore';
import type { Band } from '@/types/api';

interface Props {
  band: Band;
}

export default function FavoriteButton({ band }: Props) {
  const { toggle, isFavorite } = useFavoritesStore();
  const favorite = isFavorite(band.id);

  return (
    <button
      onClick={() => toggle(band)}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200
        ${favorite 
          ? 'bg-metal-fire text-white shadow-lg shadow-metal-fire/30 hover:bg-red-700' 
          : 'bg-metal-gray/30 text-gray-300 border border-metal-gray hover:border-metal-fire hover:text-metal-fire'}
      `}
    >
      <span className="text-xl">{favorite ? '❤️' : '🤍'}</span>
      <span>{favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
    </button>
  );
}
