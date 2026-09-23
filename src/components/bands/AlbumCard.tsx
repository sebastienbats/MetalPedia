'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Album } from '@/types/api';

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const [imageError, setImageError] = useState(false);

  // ✅ Nouvelle interface : album.title au lieu de album.name
  const title = album.title || 'Titre inconnu';

  // ✅ Nouvelle interface : album.release_type au lieu de album.type
  const releaseType = album.release_type || 'Album';

  // ✅ Nouvelle interface : album.year au lieu de album.releaseDate
  const yearDisplay = album.year ? String(album.year) : 'Année inconnue';

  // Détection d'image valide
  const hasValidImage = !imageError && album.image_url && typeof album.image_url === 'string' && album.image_url.trim() !== '';

  return (
    <div className="metal-card p-4 hover:border-metal-fire transition-colors">
      <div className="flex items-start gap-3">
        {/* Pochette de l'album avec fallback emoji */}
        <div className="relative w-12 h-12 bg-gradient-to-br from-metal-blood to-metal-rust rounded flex items-center justify-center shrink-0 overflow-hidden">
          {/* Fallback emoji (toujours visible en arrière-plan) */}
          <span className="absolute inset-0 flex items-center justify-center z-0 text-lg">
            💿
          </span>

          {/* Image optimisée si disponible */}
          {hasValidImage && (
            <Image
              src={album.image_url!}
              alt={`Pochette de ${title}`}
              fill
              sizes="48px"
              className="object-cover z-10"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Informations de l'album */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{title}</h4>
          <p className="text-xs text-metal-fire mt-1 capitalize">{releaseType}</p>
          <p className="text-xs text-gray-400 mt-1">{yearDisplay}</p>

          {/* 🆕 Métadonnées Last.fm (remplace l'ancienne section reviews) */}
          {album.playcount && album.playcount > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500">
              <span aria-hidden="true">👥</span>
              <span>{album.playcount.toLocaleString('fr-FR')} écoutes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
