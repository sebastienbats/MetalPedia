'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/api/authApi';
import { useGamificationStore } from '@/stores/gamificationStore';
import type { BandDetail, Album, BandMember, GamificationPillar } from '@/types/api';
import { PILLAR_METADATA } from '@/types/api';
import Loader from '@/components/ui/Loader';
import FavoriteButton from '@/components/bands/FavoriteButton';
import ConcertsWidget from '@/components/widgets/ConcertsWidget';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════

interface Props {
  band: BandDetail;
  albums?: Album[];
  members?: BandMember[];
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function BandDetailClient({ 
  band, 
  albums = [], 
  members = [] 
}: Props) {
  const { data: user } = useAuth();
  const { recordView } = useGamificationStore();
  const [activeTab, setActiveTab] = useState<'about' | 'albums' | 'members'>('about');

  // Récupérer les métadonnées du pilier pour l'affichage
  const pillarMeta = PILLAR_METADATA[band.genre_pillar as GamificationPillar] || PILLAR_METADATA['Heavy Metal'];

  // 1. Enregistrer la vue pour la gamification au montage
  useMemo(() => {
    if (band) {
      recordView({
        id: band.id,
        name: band.name,
        genre: band.genre,
        genre_pillar: band.genre_pillar,
        country: band.country,
      });
    }
  }, [band, recordView]);

  // 2. Configuration du statut
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

  // 3. Définition des onglets
  const tabs = useMemo(() => [
    { id: 'about', label: 'Biographie' },
    { id: 'albums', label: `Discographie (${albums.length})` },
    { id: 'members', label: `Membres (${members.length})` },
  ], [albums.length, members.length]);

  // 4. État de chargement de sécurité
  if (!band) {
    return <Loader text="Chargement des détails du groupe..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─────────────────────────────────────────────── */}
      {/* HEADER DU GROUPE                                */}
      {/* ─────────────────────────────────────────────── */}
      <div className="metal-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <span className="text-9xl font-black text-white">{band.name.charAt(0)}</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Image / Placeholder */}
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-lg bg-gradient-to-br from-metal-blood to-metal-rust flex items-center justify-center shrink-0 shadow-2xl border border-metal-gray">
            <span className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">
              {band.name.substring(0, 2).toUpperCase()}
            </span>
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

            {/* Genres : Original + Pilier */}
            <div className="flex flex-wrap gap-3 text-sm">
              {/* Genre original */}
              <span className="flex items-center gap-1 text-gray-300">
                🎸 {band.genre}
              </span>

              {/* Pilier de gamification */}
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

            {/* Infos secondaires */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">🌍 {band.country}</span>
              {band.formed && (
                <span className="flex items-center gap-1">📅 Formé en {band.formed}</span>
              )}
              
              {/* 🛡️ CORRECTION ESLINT : Vérification stricte du type 'number' */}
              {typeof band.listeners === 'number' && band.listeners > 0 && (
                <span className="flex items-center gap-1">
                  👥 {band.listeners.toLocaleString()} auditeurs
                </span>
              )}
            </div>

            {/* Bouton Favori */}
            {user && <FavoriteButton band={band} />}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/* ONGLETS DE NAVIGATION                           */}
      {/* ─────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────── */}
      {/* CONTENU DES ONGLETS                             */}
      {/* ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale (2/3) */}
        <div className="lg:col-span-2 min-h-[300px]">
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

          {activeTab === 'albums' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              {albums.length > 0 ? (
                albums.map((album) => (
                  <div key={album.id} className="metal-card p-4 hover:border-metal-fire/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded bg-metal-gray flex items-center justify-center text-2xl shrink-0">
                        💿
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{album.name || album.title}</h4>
                        <p className="text-xs text-metal-fire mt-1 capitalize">{album.type}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {album.releaseDate || album.year || 'Année inconnue'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full metal-card p-12 text-center text-gray-500">
                  Aucune discographie enregistrée pour ce groupe.
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="metal-card p-6 animate-slide-up">
              {members.length > 0 ? (
                <ul className="space-y-3">
                  {members.map((member, idx) => (
                    <li key={idx} className="flex items-center justify-between py-2 border-b border-metal-gray last:border-0">
                      <span className="font-semibold text-gray-200">{member.name}</span>
                      <div className="text-right">
                        <span className="text-sm text-metal-fire block">{member.role}</span>
                        {member.years_active && (
                          <span className="text-xs text-gray-500">{member.years_active}</span>
                        )}
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
        </div>

        {/* Colonne latérale (1/3) : Widgets */}
        <div className="space-y-6">
          {/* Widget Concerts */}
          <ConcertsWidget bandId={band.id} bandName={band.name} />
          
          {/* Widget Gamification Info */}
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
