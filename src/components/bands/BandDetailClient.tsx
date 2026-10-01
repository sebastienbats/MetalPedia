'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useStatsStore } from '@/stores/statsStore';
import type { BandDetail, Album, BandMember, GamificationPillar } from '@/types/api';
import { PILLAR_METADATA } from '@/types/api';
import Loader from '@/components/ui/Loader';
import FavoriteButton from '@/components/bands/FavoriteButton';
import ConcertsWidget from '@/components/widgets/ConcertsWidget';
import ReviewList from '@/components/reviews/ReviewList';
import GraphClient from '@/components/graph/GraphClient';

interface Props {
  band: BandDetail;
  albums?: Album[];
  members?: BandMember[];
}

function formatYearsActive(member: BandMember): string {
  if (member.begin_date && member.end_date) {
    return `${member.begin_date} - ${member.end_date}`;
  }
  if (member.begin_date) {
    return `${member.begin_date} - présent`;
  }
  if (member.end_date) {
    return `? - ${member.end_date}`;
  }
  return 'Années inconnues';
}

export default function BandDetailClient({ 
  band, 
  albums = [], 
  members = [] 
}: Props) {
  const recordGamificationView = useGamificationStore((state) => state.recordView);
  const recordStatsView = useStatsStore((state) => state.recordView);
  
  const [activeTab, setActiveTab] = useState<'about' | 'albums' | 'members' | 'reviews' | 'similar'>('about');
  const [isMounted, setIsMounted] = useState(false);
  const [bandImageError, setBandImageError] = useState(false);
  const [albumImageErrors, setAlbumImageErrors] = useState<Set<number>>(new Set());
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const pillarMeta = PILLAR_METADATA[band.genre_pillar as GamificationPillar] || PILLAR_METADATA['Heavy Metal'];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && band?.id) {
      recordGamificationView({
        id: band.id,
        name: band.name,
        genre: band.genre,
        genre_pillar: band.genre_pillar,
        country: band.country,
        formed: band.formed,
        listeners: band.listeners,
        status: band.status,
        biography: band.biography,
      });

      recordStatsView({
        id: band.id,
        name: band.name,
        genre: band.genre,
        country: band.country,
      });
    }
  }, [isMounted, band?.id]);

  const handleBandImageError = () => setBandImageError(true);
  const handleAlbumImageError = (albumId: number) => {
    setAlbumImageErrors(prev => new Set(prev).add(albumId));
  };

  const hasValidBandImage = isMounted && 
    !bandImageError && 
    band.image_url && 
    typeof band.image_url === 'string' && 
    band.image_url.trim() !== '';

  const statusConfig = useMemo(() => {
    const configs: Record<string, { label: string; icon: string; color: string }> = {
      'Active': { label: 'Actif', icon: '🟢', color: 'text-green-500' },
      'On hold': { label: 'En pause', icon: '🟡', color: 'text-yellow-500' },
      'Split-up': { label: 'Séparé', icon: '🔴', color: 'text-red-500' },
      'Unknown': { label: 'Inconnu', icon: '❓', color: 'text-gray-500' },
    };
    const statusKey = (band.status && band.status in configs) ? band.status : 'Unknown';
    return configs[statusKey];
  }, [band.status]);

  const tabs = useMemo(() => [
    { id: 'about', label: 'Biographie' },
    { id: 'albums', label: `Discographie (${albums.length})` },
    { id: 'members', label: `Membres (${members.length})` },
    { id: 'reviews', label: 'Avis' },
    { id: 'similar', label: 'Groupes similaires 🕸️' },
  ], [albums.length, members.length]);

  if (!band) {
    return <Loader text="Chargement des détails du groupe..." />;
  }

  return (
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12 space-y-6 sm:space-y-8 animate-fade-in" suppressHydrationWarning>
      
      {/* ═══════════════════════════════════════════════════════════
          HEADER DE PAGE
      ═══════════════════════════════════════════════════════════ */}
      <header className="text-center mb-4 sm:mb-6">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2">
          Fiche du groupe
        </h1>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          HEADER DU GROUPE (avec image cliquable)
      ═══════════════════════════════════════════════════════════ */}
      <div className="metal-card p-3 sm:p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <span className="text-9xl font-black text-white">{band.name.charAt(0)}</span>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
          {/* 🖼️ IMAGE DU GROUPE CLIQUABLE */}
          <div 
            className={`w-24 h-24 sm:w-40 sm:h-40 rounded-lg overflow-hidden shrink-0 shadow-2xl border border-metal-gray bg-gradient-to-br from-metal-blood to-metal-rust flex items-center justify-center relative ${
              hasValidBandImage ? 'cursor-pointer hover:scale-105 transition-transform duration-300' : ''
            }`}
            suppressHydrationWarning
            onClick={hasValidBandImage ? () => setIsImageModalOpen(true) : undefined}
          >
            <span className="absolute inset-0 flex items-center justify-center text-3xl sm:text-5xl font-black text-white drop-shadow-lg z-0">
              {band.name.substring(0, 2).toUpperCase()}
            </span>
            
            {hasValidBandImage && (
              <>
                <Image
                  src={band.image_url!}
                  alt={`Photo de ${band.name}`}
                  fill
                  sizes="(max-width: 768px) 96px, 160px"
                  className="object-cover z-10"
                  priority={true}
                  onError={handleBandImageError}
                />
                {/* Indicateur visuel au survol */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 z-20 flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="text-white text-2xl sm:text-3xl">🔍</span>
                </div>
              </>
            )}
          </div>

          {/* Infos principales */}
          <div className="flex-1 space-y-2 sm:space-y-3 w-full">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="font-metal text-xl sm:text-3xl text-metal-rust break-words">
                {band.name}
              </h2>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-metal-gray/50 border border-metal-gray flex items-center gap-1 ${statusConfig.color}`}>
                <span>{statusConfig.icon}</span>
                {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="flex items-center gap-1 text-gray-300">
                🎸 {band.genre}
              </span>
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                style={{ 
                  backgroundColor: `${pillarMeta.color}20`, 
                  borderColor: pillarMeta.color, 
                  color: pillarMeta.color 
                }}
              >
                <span>{pillarMeta.icon}</span>
                {band.genre_pillar || 'Heavy Metal'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-300" suppressHydrationWarning>
              <span className="flex items-center gap-1">🌍 {band.country}</span>
              {band.formed && (
                <span className="flex items-center gap-1">📅 Formé en {band.formed}</span>
              )}
              {typeof band.listeners === 'number' && band.listeners > 0 && (
                <span className="flex items-center gap-1">
                  👥 {band.listeners.toLocaleString('fr-FR')} auditeurs
                </span>
              )}
            </div>

            <FavoriteButton band={band} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ONGLETS DE NAVIGATION
      ═══════════════════════════════════════════════════════════ */}
      <div className="border-b border-metal-gray">
        <nav className="flex gap-4 sm:gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-2 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-metal-fire text-metal-fire'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CONTENU DES ONGLETS
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 min-h-[300px]" suppressHydrationWarning>
          {activeTab === 'about' && (
            <div className="metal-card p-4 sm:p-6 animate-slide-up">
              <h3 className="font-serif text-lg sm:text-xl mb-3 sm:mb-4 text-metal-rust flex items-center gap-2">
                📜 Biographie
                {band.bio_lang && (
                  <span className="text-xs font-sans font-normal text-gray-400 bg-metal-gray/30 px-2 py-1 rounded">
                    {band.bio_lang.toUpperCase()}
                  </span>
                )}
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {band.biography || 'Aucune biographie disponible pour ce groupe pour le moment.'}
              </p>
            </div>
          )}

          {activeTab === 'albums' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-slide-up">
              {albums.length > 0 ? (
                albums.map((album) => {
                  const hasAlbumImage = isMounted && 
                    !albumImageErrors.has(album.id) &&
                    album.image_url && 
                    typeof album.image_url === 'string' && 
                    album.image_url.trim() !== '';
                  
                  return (
                    <div key={album.id} className="metal-card p-3 sm:p-4 hover:border-metal-fire/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-16 h-16 rounded bg-metal-gray flex items-center justify-center text-2xl shrink-0 overflow-hidden relative"
                          suppressHydrationWarning
                        >
                          <span className="absolute inset-0 flex items-center justify-center z-0">💿</span>
                          {hasAlbumImage && (
                            <Image
                              src={album.image_url!}
                              alt={`Pochette de ${album.title}`}
                              fill
                              sizes="64px"
                              className="object-cover z-10"
                              loading="lazy"
                              onError={() => handleAlbumImageError(album.id)}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{album.title}</h4>
                          <p className="text-xs text-metal-fire mt-1 capitalize">
                            {album.release_type || 'Album'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {album.year || 'Année inconnue'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full metal-card p-8 sm:p-12 text-center text-gray-500">
                  Aucune discographie enregistrée pour ce groupe.
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="metal-card p-4 sm:p-6 animate-slide-up">
              {members.length > 0 ? (
                <ul className="space-y-2 sm:space-y-3">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between py-2 border-b border-metal-gray last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-200 text-sm sm:text-base">{member.name}</span>
                        {member.is_active && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            Actuel
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm text-metal-fire block">{member.role || 'Rôle inconnu'}</span>
                        <span className="text-xs text-gray-500">
                          {formatYearsActive(member)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  Aucune information sur les membres disponible.
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-slide-up">
              <ReviewList bandId={band.id} />
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="animate-slide-up">
              <GraphClient
                sourceBand={{
                  band_id: band.id,
                  name: band.name,
                  genre: band.genre,
                  country: band.country,
                }}
              />
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4 sm:space-y-6">
          <ConcertsWidget bandId={band.id} bandName={band.name} />
          
          <div className="metal-card p-4 sm:p-6 border border-metal-gray">
            <h3 className="font-serif text-base sm:text-lg text-gray-200 mb-2 sm:mb-3">💡 Progression</h3>
            <p className="text-xs sm:text-sm text-gray-400">
              Explorer ce groupe vous a fait gagner <span className="text-metal-fire font-bold">+10 XP</span> 
              et contribue à votre progression dans le pilier{' '}
              <span className="font-semibold" style={{ color: pillarMeta.color }}>
                {band.genre_pillar}
              </span>.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODALE D'IMAGE DU GROUPE
      ═══════════════════════════════════════════════════════════ */}
      {isImageModalOpen && hasValidBandImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-metal-fire transition-colors text-4xl z-10"
            aria-label="Fermer"
          >
            ✕
          </button>
          
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={band.image_url!}
              alt={`Photo de ${band.name}`}
              width={1200}
              height={800}
              className="object-contain max-w-full max-h-full rounded-lg shadow-2xl"
              priority
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-metal-gray">
              <p className="text-white font-metal text-lg sm:text-xl">{band.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
