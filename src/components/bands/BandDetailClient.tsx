'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
import type { BandDetail, Album, BandMember } from '@/types/api';

// ═══════════════════════════════════════════
// STORES (Zustand)
// ═══════════════════════════════════════════
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useStatsStore } from '@/stores/statsStore';
import { useGamificationStore } from '@/stores/gamificationStore';

// ═══════════════════════════════════════════
// API HOOKS
// ═══════════════════════════════════════════
import { useAuth } from '@/api/authApi';
import { fetchAudioFeatures } from '@/api/spotify';

// ═══════════════════════════════════════════
// COMPOSANTS UI
// ═══════════════════════════════════════════
import AlbumCard from './AlbumCard';
import ReviewForm from '@/components/social/ReviewForm';
import ReviewList from '@/components/social/ReviewList';
import AuthModal from '@/components/social/AuthModal';
import ConcertsWidget from '@/components/widgets/ConcertsWidget';
import SpotifyEmbed from '@/components/widgets/SpotifyEmbed';
import AudioRadar from '@/components/visual/AudioRadar';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════
interface Props {
  band: BandDetail;
}

export default function BandDetailClient({ band }: Props) {
  // ─────────────────────────────────────────
  // ÉTAT LOCAL
  // ─────────────────────────────────────────
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bio' | 'discography' | 'lineup' | 'reviews'>('bio');

  // ─────────────────────────────────────────
  // STORES
  // ─────────────────────────────────────────
  const { isFavorite, toggle } = useFavoritesStore();
  const recordStatsView = useStatsStore((s) => s.recordView);
  const recordGameView = useGamificationStore((s) => s.recordView);
  const recordGenreDiscovery = useGamificationStore((s) => s.recordGenreDiscovery);

  // ─────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────
  const { data: user } = useAuth();
  const isAuthenticated = !!user;

  const isFav = isFavorite(band.id);

  // ─────────────────────────────────────────
  // AUDIO FEATURES (Spotify)
  // ─────────────────────────────────────────
  const { data: audioFeatures, isLoading: audioLoading } = useQuery({
    queryKey: ['audio-features', band.name],
    queryFn: () => fetchAudioFeatures(band.name),
    enabled: !!band.name,
    staleTime: 24 * 60 * 60 * 1000, // 24h
  });

  // ═══════════════════════════════════════════
  // EFFETS : TRACKING & GAMIFICATION
  // ═══════════════════════════════════════════
  useEffect(() => {
    // Tracking statistiques
    recordStatsView({
      id: band.id,
      name: band.name,
      genre: band.genre,
      country: band.country,
    });

    // Gamification : XP pour consultation
    recordGameView({
      id: band.id,
      name: band.name,
      genre: band.genre,
      country: band.country,
    });

    // Gamification : découverte de genre
    recordGenreDiscovery(band.genre);
  }, [band.id, band.name, band.genre, band.country, recordStatsView, recordGameView, recordGenreDiscovery]);

  // ═══════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════
  const handleToggleFavorite = useCallback(() => {
    toggle({
      id: band.id,
      name: band.name,
      genre: band.genre,
      country: band.country,
    });
  }, [toggle, band]);

  const handleReviewSubmit = useCallback(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    }
  }, [isAuthenticated]);

  // ═══════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════
  const statusConfig = useMemo(() => {
    const configs: Record<string, { label: string; icon: string; color: string }> = {
      'Active': { label: 'Actif', icon: '🔥', color: 'text-green-400' },
      'Split-up': { label: 'Séparé', icon: '⚰️', color: 'text-gray-400' },
      'Changed name': { label: 'Renommé', icon: '🔄', color: 'text-blue-400' },
      'On hold': { label: 'En pause', icon: '⏸️', color: 'text-yellow-400' },
      'Unknown': { label: 'Inconnu', icon: '❓', color: 'text-gray-500' },
    };
    return configs[band.status] || configs['Unknown'];
  }, [band.status]);

  const tabs = useMemo(() => [
    { id: 'bio' as const, label: 'Biographie', icon: '📖', show: !!band.biography },
    { id: 'discography' as const, label: 'Discographie', icon: '💿', show: (band.discography?.length || 0) > 0 },
    { id: 'lineup' as const, label: 'Membres', icon: '🎸', show: !!band.currentLineup || !!band.pastLineup },
    { id: 'reviews' as const, label: 'Critiques', icon: '✍️', show: true },
  ].filter(tab => tab.show), [band]);

  // ═══════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-8 animate-fade-in">
      {/* ═══════════════════════════════════════
          HEADER DU GROUPE
          ═══════════════════════════════════════ */}
      <header className="border-b border-metal-gray pb-6">
        {/* Lien retour */}
        <Link
          href="/"
          className="text-sm text-metal-fire hover:text-metal-rust mb-4 inline-flex items-center gap-2 transition-colors"
        >
          <span aria-hidden="true">←</span>
          Retour à l'accueil
        </Link>

        {/* Actions principales */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Nom du groupe */}
            <h1 className="font-metal text-4xl md:text-6xl text-metal-rust mb-4 text-glow-blood break-words">
              {band.name}
            </h1>

            {/* Badges d'informations */}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 bg-metal-dark border border-metal-gray rounded-full flex items-center gap-1">
                <span aria-hidden="true">🌍</span>
                {band.country}
                {band.location && <span className="text-gray-400">, {band.location}</span>}
              </span>

              <span className="px-3 py-1 bg-metal-dark border border-metal-fire rounded-full text-metal-fire flex items-center gap-1">
                <span aria-hidden="true">🎸</span>
                {band.genre}
              </span>

              <span className="px-3 py-1 bg-metal-dark border border-metal-gray rounded-full flex items-center gap-1">
                <span aria-hidden="true">📅</span>
                Formé en {band.formed}
              </span>

              <span className={`px-3 py-1 bg-metal-dark border border-metal-gray rounded-full flex items-center gap-1 ${statusConfig.color}`}>
                <span aria-hidden="true">{statusConfig.icon}</span>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleToggleFavorite}
              className={`metal-button flex items-center gap-2 ${isFav ? 'opacity-90' : ''}`}
              aria-pressed={isFav}
              aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <span aria-hidden="true">{isFav ? '⭐' : '☆'}</span>
              <span className="hidden sm:inline">{isFav ? 'Favori' : 'Ajouter'}</span>
            </button>

            <Link
              href={`/graph/${band.id}`}
              className="metal-button flex items-center gap-2"
              aria-label="Voir le graphe de similarité"
            >
              <span aria-hidden="true">🕸️</span>
              <span className="hidden sm:inline">Graphe</span>
            </Link>

            <Link
              href={`/audio/${band.id}`}
              className="metal-button flex items-center gap-2"
              aria-label="Voir l'analyse audio"
            >
              <span aria-hidden="true">🎧</span>
              <span className="hidden sm:inline">Audio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════
          GRILLE PRINCIPALE
          ═══════════════════════════════════════ */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* ─────────────────────────────────────
            CONTENU PRINCIPAL (2/3)
            ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Onglets */}
          {tabs.length > 1 && (
            <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Sections de la fiche">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-metal-blood to-metal-rust text-white shadow-lg'
                      : 'bg-metal-dark border border-metal-gray text-gray-300 hover:border-metal-fire'
                  }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          )}

          {/* BIOGRAPHIE */}
          {(activeTab === 'bio' || tabs.length === 1) && band.biography && (
            <section aria-labelledby="biography-title" className="animate-slide-up">
              <h2 id="biography-title" className="font-serif text-2xl mb-3 text-metal-fire">
                📖 Biographie
              </h2>
              <div className="metal-card p-6">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {band.biography}
                </p>
              </div>
            </section>
          )}

          {/* DISCOGRAPHIE */}
          {(activeTab === 'discography' || tabs.length === 1) && band.discography && band.discography.length > 0 && (
            <section aria-labelledby="discography-title" className="animate-slide-up">
              <h2 id="discography-title" className="font-serif text-2xl mb-4 text-metal-fire">
                💿 Discographie ({band.discography.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {band.discography.map((album: Album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}

          {/* MEMBRES */}
          {(activeTab === 'lineup' || tabs.length === 1) && (band.currentLineup || band.pastLineup) && (
            <section aria-labelledby="lineup-title" className="animate-slide-up">
              <h2 id="lineup-title" className="font-serif text-2xl mb-4 text-metal-fire">
                🎸 Membres
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {band.currentLineup && band.currentLineup.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl mb-3 text-green-400 flex items-center gap-2">
                      <span aria-hidden="true">🔥</span>
                      Membres actuels
                    </h3>
                    <ul className="space-y-2">
                      {band.currentLineup.map((member: BandMember, idx: number) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-sm bg-metal-dark p-3 rounded border border-metal-gray"
                        >
                          <span className="font-semibold">{member.name}</span>
                          <span className="text-gray-400 italic">{member.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {band.pastLineup && band.pastLineup.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl mb-3 text-gray-400 flex items-center gap-2">
                      <span aria-hidden="true">⚰️</span>
                      Anciens membres
                    </h3>
                    <ul className="space-y-2">
                      {band.pastLineup.map((member: BandMember, idx: number) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-sm bg-metal-dark/50 p-3 rounded border border-metal-gray"
                        >
                          <span className="font-semibold text-gray-300">{member.name}</span>
                          <span className="text-gray-500 italic">{member.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AUDIO ANALYSIS (Spotify) */}
          {audioFeatures && (
            <section aria-labelledby="audio-title">
              <h2 id="audio-title" className="font-serif text-2xl mb-4 text-metal-fire">
                🎧 Empreinte Audio
              </h2>
              <AudioRadar features={audioFeatures} bandName={band.name} />
            </section>
          )}

          {/* CONCERTS */}
          <section aria-labelledby="concerts-title">
            <h2 id="concerts-title" className="font-serif text-2xl mb-4 text-metal-fire">
              🎤 Concerts à venir
            </h2>
            <ConcertsWidget bandName={band.name} />
          </section>

          {/* CRITIQUES */}
          {(activeTab === 'reviews' || tabs.length === 1) && (
            <section aria-labelledby="reviews-title" className="animate-slide-up">
              <h2 id="reviews-title" className="font-serif text-2xl mb-4 text-metal-fire">
                ✍️ Critiques communautaires
              </h2>

              {isAuthenticated ? (
                <ReviewForm
                  bandId={band.id}
                  bandName={band.name}
                  onAuthRequired={handleReviewSubmit}
                />
              ) : (
                <div className="metal-card p-6 text-center mb-6">
                  <p className="text-gray-400 mb-4">
                    Connectez-vous pour écrire une critique et gagner de l'XP.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="metal-button"
                  >
                    🔐 Se connecter
                  </button>
                </div>
              )}

              <div className="mt-6">
                <ReviewList bandId={band.id} />
              </div>
            </section>
          )}
        </div>

        {/* ─────────────────────────────────────
            SIDEBAR (1/3)
            ───────────────────────────────────── */}
        <aside className="space-y-6">
          {/* Informations générales */}
          <div className="metal-card p-5">
            <h3 className="font-serif text-lg mb-4 text-metal-fire flex items-center gap-2">
              <span aria-hidden="true">📋</span>
              Informations
            </h3>
            <dl className="space-y-3 text-sm">
              {band.themes && (
                <>
                  <dt className="text-gray-400">Thèmes</dt>
                  <dd className="text-gray-200 mb-2">{band.themes}</dd>
                </>
              )}
              {band.label && (
                <>
                  <dt className="text-gray-400">Label actuel</dt>
                  <dd className="text-gray-200 mb-2">{band.label}</dd>
                </>
              )}
              {band.yearsActive && (
                <>
                  <dt className="text-gray-400">Années d'activité</dt>
                  <dd className="text-gray-200 mb-2">{band.yearsActive}</dd>
                </>
              )}
              <dt className="text-gray-400">Pays</dt>
              <dd className="text-gray-200 mb-2">{band.country}</dd>
              <dt className="text-gray-400">Statut</dt>
              <dd className={`mb-2 ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </dd>
            </dl>
          </div>

          {/* Liens externes */}
          {band.links && band.links.length > 0 && (
            <div className="metal-card p-5">
              <h3 className="font-serif text-lg mb-4 text-metal-fire flex items-center gap-2">
                <span aria-hidden="true">🔗</span>
                Liens
              </h3>
              <ul className="space-y-2">
                {band.links.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-metal-fire hover:text-metal-rust hover:underline break-all inline-flex items-center gap-2"
                    >
                      <span aria-hidden="true">→</span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Spotify Embed (si disponible) */}
          {band.discography?.[0]?.spotifyId && (
            <div className="metal-card p-5">
              <h3 className="font-serif text-lg mb-4 text-metal-fire flex items-center gap-2">
                <span aria-hidden="true">🎵</span>
                Écouter
              </h3>
              <SpotifyEmbed
                spotifyId={band.discography[0].spotifyId}
                type="album"
              />
            </div>
          )}

          {/* Actions */}
          <div className="metal-card p-5 space-y-3">
            <a
              href={`https://www.metal-archives.com/bands/${encodeURIComponent(band.name)}/${band.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="metal-button w-full flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">📖</span>
              Voir sur Metal Archives
            </a>

            <Link
              href={`/profile`}
              className="metal-button w-full flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">⚔️</span>
              Voir ma progression
            </Link>
          </div>

          {/* Statistiques rapides */}
          <div className="metal-card p-5">
            <h3 className="font-serif text-lg mb-4 text-metal-fire flex items-center gap-2">
              <span aria-hidden="true">📊</span>
              Stats
            </h3>
            <dl className="space-y-2 text-sm">
              {band.discography && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Albums</dt>
                  <dd className="font-semibold">{band.discography.length}</dd>
                </div>
              )}
              {band.currentLineup && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Membres actuels</dt>
                  <dd className="font-semibold">{band.currentLineup.length}</dd>
                </div>
              )}
              {band.pastLineup && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Anciens membres</dt>
                  <dd className="font-semibold">{band.pastLineup.length}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════
          MODAL D'AUTHENTIFICATION
          ═══════════════════════════════════════ */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
