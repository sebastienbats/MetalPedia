'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useGamificationStore } from '@/stores/gamificationStore';
import type { BandDetail, Album, BandMember, GamificationPillar } from '@/types/api';
import { PILLAR_METADATA } from '@/types/api';
import Loader from '@/components/ui/Loader';
import FavoriteButton from '@/components/bands/FavoriteButton';
import ConcertsWidget from '@/components/widgets/ConcertsWidget';
import ReviewList from '@/components/reviews/ReviewList';
import GraphClient from '@/components/graph/GraphClient';

// ═══════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════
interface Props {
  band: BandDetail;
  albums?: Album[];
  members?: BandMember[];
}

// ═══════════════════════════════════════════
// HELPER : Calculer les années actives depuis begin_date/end_date
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════
export default function BandDetailClient({ 
  band, 
  albums = [], 
  members = [] 
}: Props) {
  const { recordView } = useGamificationStore();
  
  const [activeTab, setActiveTab] = useState<'about' | 'albums' | 'members' | 'reviews' | 'similar'>('about');
  const [isMounted, setIsMounted] = useState(false);
  const [bandImageError, setBandImageError] = useState(false);
  const [albumImageErrors, setAlbumImageErrors] = useState<Set<number>>(new Set());

  const pillarMeta = PILLAR_METADATA[band.genre_pillar as GamificationPillar] || PILLAR_METADATA['Heavy Metal'];

  // Marquer comme monté après l'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Enregistrement de la vue (une seule fois au montage)
  useEffect(() => {
    if (isMounted && band?.id) {
      recordView({
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, band?.id]);

  // Gestion de l'erreur de chargement de l'image du groupe
  const handleBandImageError = () => {
    setBandImageError(true);
  };

  // Gestion de l'erreur de chargement d'une pochette d'album
  const handleAlbumImageError = (albumId: number) => {
    setAlbumImageErrors(prev => new Set(prev).add(albumId));
  };

  // Vérification robuste de l'image du groupe
  const hasValidBandImage = isMounted && 
    !bandImageError && 
    band.image_url && 
    typeof band.image_url === 'string' && 
    band.image_url.trim() !== '';

  // Statut
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

  // Onglets avec "Groupes similaires" EN DERNIER
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
    <div className="space-y-8 animate-fade-in" suppressHydrationWarning>
      {/* ═══════════════════════════════════════════════════════════
          HEADER DU GROUPE (avec image optimisée)
      ═══════════════════════════════════════════════════════════ */}
      <div className="metal-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <span className="text-9xl font-black text-white">{band.name.charAt(0)}</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* 🖼️ IMAGE DU GROUPE OPTIMISÉE */}
          <div 
            className="w-32 h-32 md:w-48 md:h-48 rounded-lg overflow-hidden shrink-0 shadow-2xl border border-metal-gray bg-gradient-to-br from-metal-blood to-metal-rust flex items-center justify-center relative"
            suppressHydrationWarning
          >
            {/* Placeholder EN ARRIÈRE-PLAN (z-0) */}
            <span className="absolute inset-0 flex items-center justify-center text-4xl md:text-6xl font-black text-white drop-shadow-lg z-0">
              {band.name.substring(0, 2).toUpperCase()}
            </span>
            
            {/* Image optimisée AU-DESSUS (z-10) */}
            {hasValidBandImage && (
              <Image
                src={band.image_url!}
                alt={`Photo de ${band.name}`}
                fill
                sizes="(max-width: 768px) 128px, 192px"
                className="object-cover z-10"
                priority={true}
                onError={handleBandImageError}
              />
            )}
          </div>

          {/* Infos principales */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-metal text-3xl md:text-5xl text-metal-rust">
                {band.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-metal-gray/50 border border-metal-gray flex items-center gap-1 ${statusConfig.color}`}>
                <span>{statusConfig.icon}</span>
                {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
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

            <div className="flex flex-wrap gap-4 text-sm text-gray-300" suppressHydrationWarning>
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
        <nav className="flex gap-6 overflow-x-auto">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 min-h-[300px]" suppressHydrationWarning>
          
          {/* Biographie */}
          {activeTab === 'about' && (
            <div className="metal-card p-6 animate-slide-up">
              <h3 className="font-serif text-xl mb-4 text-metal-rust flex items-center gap-2">
                📜 Biographie
                {band.bio_lang && (
                  <span className="text-xs font-sans font-normal text-gray-400 bg-metal-gray/30 px-2 py-1 rounded">
                    {band.bio_lang.toUpperCase()}
                  </span>
                )}
              </h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {band.biography || 'Aucune biographie disponible pour ce groupe pour le moment.'}
              </p>
            </div>
          )}

          {/* ✅ Discographie avec pochettes optimisées - CORRIGÉ */}
          {activeTab === 'albums' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              {albums.length > 0 ? (
                albums.map((album) => {
                  const hasAlbumImage = isMounted && 
                    !albumImageErrors.has(album.id) &&
                    album.image_url && 
                    typeof album.image_url === 'string' && 
                    album.image_url.trim() !== '';
                  
                  return (
                    <div key={album.id} className="metal-card p-4 hover:border-metal-fire/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Pochette de l'album optimisée */}
                        <div 
                          className="w-16 h-16 rounded bg-metal-gray flex items-center justify-center text-2xl shrink-0 overflow-hidden relative"
                          suppressHydrationWarning
                        >
                          {/* Emoji EN ARRIÈRE-PLAN (z-0) */}
                          <span className="absolute inset-0 flex items-center justify-center z-0">💿</span>
                          
                          {/* Image optimisée AU-DESSUS (z-10) */}
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
                <div className="col-span-full metal-card p-12 text-center text-gray-500">
                  Aucune discographie enregistrée pour ce groupe.
                </div>
              )}
            </div>
          )}

          {/* ✅ Membres (avec badge "Actuel") - CORRIGÉ */}
          {activeTab === 'members' && (
            <div className="metal-card p-6 animate-slide-up">
              {members.length > 0 ? (
                <ul className="space-y-3">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between py-2 border-b border-metal-gray last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-200">{member.name}</span>
                        {member.is_active && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            Actuel
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-metal-fire block">{member.role || 'Rôle inconnu'}</span>
                        <span className="text-xs text-gray-500">
                          {formatYearsActive(member)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Aucune information sur les membres disponible.
                </div>
              )}
            </div>
          )}

          {/* Avis */}
          {activeTab === 'reviews' && (
            <div className="animate-slide-up">
              <ReviewList bandId={band.id} />
            </div>
          )}

          {/* GROUPES SIMILAIRES (graphe interactif) - EN DERNIER */}
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
        <div className="space-y-6">
          <ConcertsWidget bandId={band.id} bandName={band.name} />
          
          <div className="metal-card p-6 border border-metal-gray">
            <h3 className="font-serif text-lg text-gray-200 mb-3">💡 Progression</h3>
            <p className="text-sm text-gray-400">
              Explorer ce groupe vous a fait gagner <span className="text-metal-fire font-bold">+10 XP</span> 
              et contribue à votre progression dans le pilier{' '}
              <span className="font-semibold" style={{ color: pillarMeta.color }}>
                {band.genre_pillar}
              </span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
