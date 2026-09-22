'use client';

import { useState, useMemo } from 'react';
import {
  TIMELINE_BADGES,
  TOTAL_FRAGMENTS,
  getProgressBadges,
  getPillarBadges,
  type TimelineBadge,
} from '@/lib/gamification/timeline-badges';
import { useAchievementStore } from '@/stores/achievementStore';
import { useFragmentStore } from '@/stores/fragmentStore';
import { RARITY_CONFIG } from '@/stores/notificationStore';

type Filter = 'all' | 'unlocked' | 'locked';

// ═══════════════════════════════════════════════════════════
// BADGE CARD
// ═══════════════════════════════════════════════════════════
function BadgeCard({ badge }: { badge: TimelineBadge }) {
  const isUnlocked = useAchievementStore((s) => s.isUnlocked(badge.id));
  const unlockedAt = useAchievementStore((s) => s.getUnlockedAt(badge.id));
  const config = RARITY_CONFIG[badge.rarity];

  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="badge-card group relative p-4 rounded-xl border-2 transition-all duration-300"
      style={{
        backgroundColor: isUnlocked ? 'rgba(10, 10, 10, 0.6)' : 'rgba(10, 10, 10, 0.2)',
        borderColor: isUnlocked ? config.color : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isUnlocked ? `0 0 20px ${config.glow}` : 'none',
        opacity: isUnlocked ? 1 : 0.6,
        filter: isUnlocked ? 'none' : 'grayscale(1)',
      }}
    >
      {/* Badge de rareté */}
      <div
        className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`,
        }}
      >
        {config.medal} {config.label}
      </div>

      {/* Icône */}
      <div
        className="text-5xl mb-3 transition-transform group-hover:scale-110"
        style={{
          filter: isUnlocked ? `drop-shadow(0 0 10px ${config.glow})` : 'none',
        }}
      >
        {badge.icon}
      </div>

      {/* Titre */}
      <h3
        className="font-metal text-base mb-1 leading-tight"
        style={{ color: isUnlocked ? config.color : '#666' }}
      >
        {badge.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-snug line-clamp-3">
        {badge.description}
      </p>

      {/* Date de déblocage ou état verrouillé */}
      {isUnlocked && formattedDate ? (
        <div className="mt-3 pt-2 border-t border-metal-gray/50 text-[10px] text-gray-500 flex items-center gap-1">
          <span>📅</span>
          <span>{formattedDate}</span>
        </div>
      ) : (
        <div className="mt-3 pt-2 border-t border-metal-gray/30 text-[10px] text-gray-600 flex items-center gap-1">
          <span>🔒</span>
          <span>Non débloqué</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function TimelineBadgesPanel() {
  const [filter, setFilter] = useState<Filter>('all');
  const unlockedBadges = useAchievementStore((s) => s.unlockedBadges);
  const collectedIds = useFragmentStore((s) => s.collectedIds);

  const unlockedCount = unlockedBadges.length;

  const progressBadges = useMemo(() => getProgressBadges(), []);
  const pillarBadges = useMemo(() => getPillarBadges(), []);

  // Filtrer les badges selon l'onglet actif
  const filterBadge = (badge: TimelineBadge) => {
    const isUnlocked = useAchievementStore.getState().isUnlocked(badge.id);
    if (filter === 'all') return true;
    if (filter === 'unlocked') return isUnlocked;
    return !isUnlocked;
  };

  const filteredProgress = progressBadges.filter(filterBadge);
  const filteredPillar = pillarBadges.filter(filterBadge);

  const progressPercent = Math.round((unlockedCount / TIMELINE_BADGES.length) * 100);

  return (
    <div className="metal-card p-5 sm:p-6 border-2 border-metal-gray">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="font-metal text-xl sm:text-2xl text-metal-fire flex items-center gap-2">
            <span aria-hidden="true">🏆</span>
            Hauts Faits de la Timeline
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            <span className="text-metal-fire font-semibold">
              {unlockedCount}/{TIMELINE_BADGES.length}
            </span>{' '}
            badges débloqués •{' '}
            <span className="text-yellow-400 font-semibold">
              {collectedIds.length}/{TOTAL_FRAGMENTS}
            </span>{' '}
            fragments
          </p>
        </div>

        {/* Filtres */}
        <div className="flex gap-1 bg-metal-black/40 rounded-lg p-1 border border-metal-gray/50">
          {([
            { id: 'all', label: 'Tous' },
            { id: 'unlocked', label: 'Débloqués' },
            { id: 'locked', label: 'Verrouillés' },
          ] as { id: Filter; label: string }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filter === f.id
                  ? 'bg-metal-fire text-white'
                  : 'text-gray-400 hover:text-white hover:bg-metal-gray/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progression totale</span>
          <span className="text-metal-fire font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-metal-gray rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-metal-fire to-yellow-500 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* État vide */}
      {filteredProgress.length === 0 && filteredPillar.length === 0 && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3 opacity-40">
            {filter === 'unlocked' ? '🔍' : '🏆'}
          </div>
          <p className="text-gray-400 text-sm">
            {filter === 'unlocked'
              ? 'Aucun badge débloqué pour le moment.'
              : 'Tous les badges sont déjà débloqués !'}
          </p>
        </div>
      )}

      {/* Section Badges de Progression */}
      {filteredProgress.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-metal-gray" />
            <span>📈 Progression</span>
            <span className="w-full h-px bg-metal-gray flex-1" />
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredProgress.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Section Badges de Pilier */}
      {filteredPillar.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-metal-gray" />
            <span>🏛️ Maîtrise des Neuf Genres</span>
            <span className="w-full h-px bg-metal-gray flex-1" />
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredPillar.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
