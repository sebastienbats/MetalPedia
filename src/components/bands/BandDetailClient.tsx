'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BandDetail } from '@/types/api';
import AlbumCard from './AlbumCard';
import ReviewForm from '@/components/social/ReviewForm';
import ReviewList from '@/components/social/ReviewList';
import ConcertsWidget from '@/components/widgets/ConcertsWidget';
import AuthModal from '@/components/social/AuthModal';
import { useStatsStore } from '@/stores/statsStore';
import { useFavoritesStore } from '@/stores/favoritesStore';

interface Props {
  band: BandDetail;
}

export default function BandDetailClient({ band }: Props) {
  const recordView = useStatsStore((s) => s.recordView);
  const { isFavorite, toggle } = useFavoritesStore();
  const [authOpen, setAuthOpen] = useState(false);

  const fav = isFavorite(band.id);

  useEffect(() => {
    recordView({
      id: band.id,
      name: band.name,
      genre: band.genre,
      country: band.country,
    });
  }, [band.id, band.name, band.genre, band.country, recordView]);

  return (
    <div className="space-y-8">
      <header className="border-b border-metal-gray pb-6">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/" className="text-sm text-metal-fire hover:text-metal-rust mb-4 inline-block">
              ← Retour
            </Link>
            <h1 className="font-metal text-4xl md:text-6xl text-metal-rust mb-4">{band.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-metal-dark border border-metal-gray rounded-full">
                🌍 {band.country}
              </span>
              <span className="px-3 py-1 bg-metal-dark border border-metal-fire rounded-full text-metal-fire">
                🎸 {band.genre}
              </span>
              <span className="px-3 py-1 bg-metal-dark border border-metal-gray rounded-full">
                📅 Formé en {band.formed}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggle({ id: band.id, name: band.name, genre: band.genre, country: band.country })}
              className="metal-button"
            >
              {fav ? '⭐ Favori' : '☆ Ajouter'}
            </button>
            <Link href={`/graph/${band.id}`} className="metal-button">
              🕸️ Graphe
            </Link>
            <Link href={`/audio/${band.id}`} className="metal-button">
              🎧 Audio
            </Link>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {band.biography && (
            <section>
              <h2 className="font-serif text-2xl mb-3">Biographie</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{band.biography}</p>
            </section>
          )}

          {band.discography && band.discography.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl mb-4">Discographie ({band.discography.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {band.discography.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-serif text-2xl mb-4">Concerts à venir</h2>
            <ConcertsWidget bandName={band.name} />
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Critiques communautaires</h2>
            <ReviewForm bandId={band.id} bandName={band.name} onAuthRequired={() => setAuthOpen(true)} />
            <div className="mt-6">
              <ReviewList bandId={band.id} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="metal-card p-5">
            <h3 className="font-serif text-lg mb-4 text-metal-fire">Informations</h3>
            <dl className="space-y-3 text-sm">
              {band.themes && (
                <>
                  <dt className="text-gray-400">Thèmes</dt>
                  <dd className="mb-2">{band.themes}</dd>
                </>
              )}
              {band.label && (
                <>
                  <dt className="text-gray-400">Label actuel</dt>
                  <dd className="mb-2">{band.label}</dd>
                </>
              )}
              {band.yearsActive && (
                <>
                  <dt className="text-gray-400">Années d'activité</dt>
                  <dd className="mb-2">{band.yearsActive}</dd>
                </>
              )}
            </dl>
          </div>

          <a
            href={`https://www.metal-archives.com/bands/${band.name}/${band.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block metal-button text-center w-full"
          >
            📖 Voir sur Metal Archives
          </a>
        </aside>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
