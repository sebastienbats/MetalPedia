'use client';

import { useState, useMemo } from 'react';
import {
  TIMELINE_BADGES,
  getProgressBadges,
  getPillarBadges,
  type TimelineBadge,
} from '@/lib/gamification/timeline-badges';
import { useAchievementStore } from '@/stores/achievementStore';
import { RARITY_CONFIG } from '@/stores/notificationStore';

type Filter = 'all' | 'unlocked' | 'locked';

// ═══════════════════════════════════════════════════════════
// MODALE DE DÉTAIL DU BADGE
// ═══════════════════════════════════════════════════════════
function BadgeModal({ badge, onClose }: { badge: TimelineBadge; onClose: () => void }) {
  const config = RARITY_CONFIG[badge.rarity];
  const isUnlocked = useAchievementStore((s) => s.isUnlocked(badge.id));
  const unlockedAt = useAchievementStore((s) => s.getUnlockedAt(badge.id));

  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md metal-card border-2 p-6 animate-slide-up"
        style={{ borderColor: config.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <div 
            className="text-6xl mb-3 inline-block"
            style={{ filter: isUnlocked ? `drop-shadow(0 0 15px ${config.glow})` : 'grayscale(1) opacity(0.5)' }}
          >
            {badge.icon}
          </div>
          <h3 className="font-metal text-2xl mb-2" style={{ color: isUnlocked ? config.color : '#666' }}>
            {badge.title}
          </h3>
          <div 
            className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded inline-block"
            style={{ backgroundColor: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` }}
          >
            {config.medal} {config.label}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed text-center">
            {badge.description}
          </p>

          {isUnlocked && formattedDate && (
            <div className="text-center pt-2 border-t border-metal-gray/50">
              <span className="text-xs text-gray-500">Débloqué le {formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CARTE DE BADGE (Compacte)
// ═══════════════════════════════════════════════════════════
function BadgeCard({ badge, onClick }: { badge: TimelineBadge; onClick: () => void }) {
  const isUnlocked = useAchievementStore((s) => s.isUnlocked(badge.id));
  const config = RARITY_CONFIG[badge.rarity];

  return (
    <div
      onClick={onClick}
      className="badge-card group relative p-2 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:scale-105"
      style={{
        backgroundColor: isUnlocked ? 'rgba(10, 10, 10, 0.6)' : 'rgba(10, 10, 10, 0.2)',
        borderColor: isUnlocked ? config.color : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isUnlocked ? `0 0 15px ${config.glow}` : 'none',
        opacity: isUnlocked ? 1 : 0.6,
        filter: isUnlocked ? 'none' : 'grayscale(1)',
      }}
    >
      <div className="text-center">
        <div 
          className="text-3xl mb-1 transition-transform group-hover:scale-110"
          style={{ filter: isUnlocked ? `drop-shadow(0 0 8px ${config.glow})` : 'none' }}
        >
          {badge.icon}
        </div>
        <h3 className="font-metal text-xs mb-1 leading-tight break-words" style={{ color: isUnlocked ? config.color : '#666' }}>
          {badge.title}
        </h3>
        <div className="text-[10px] text-gray-500">
          {isUnlocked ? '✓ Débloqué' : '🔒 Verrouillé'}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function TimelineBadgesPanel() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedBadge, setSelectedBadge] = useState<TimelineBadge | null>(null);
  
  const unlockedBadges = useAchievementStore((s) => s.unlockedBadges);
  const unlockedCount = unlockedBadges.length;

  const progressBadges = useMemo(() => getProgressBadges(), []);
  const pillarBadges = useMemo(() => getPillarBadges(), []);

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
    <>
      <div className="metal-card p-2 sm:p-3 border-2 border-metal-gray">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="font-metal text-lg sm:text-xl text-metal-fire flex items-center gap-2">
              <span aria-hidden="true">🏆</span>
              Hauts Faits
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              <span className="text-metal-fire font-semibold">{unlockedCount}/{TIMELINE_BADGES.length}</span> badges
            </p>
          </div>

          <div className="flex gap-1 bg-metal-black/40 rounded-lg p-1 border border-metal-gray/50">
            {([
              { id: 'all', label: 'Tous' },
              { id: 'unlocked', label: 'Débloqués' },
              { id: 'locked', label: 'Verrouillés' },
            ] as { id: Filter; label: string }[]).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all ${
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

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progression</span>
            <span className="text-metal-fire font-bold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-metal-gray rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-metal-fire to-yellow-500 transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {filteredProgress.length === 0 && filteredPillar.length === 0 && (
          <div className="text-center py-4">
            <div className="text-3xl mb-2 opacity-40">{filter === 'unlocked' ? '🔍' : '🏆'}</div>
            <p className="text-gray-400 text-xs">
              {filter === 'unlocked' ? 'Aucun badge débloqué.' : 'Tous les badges sont débloqués !'}
            </p>
          </div>
        )}

        {filteredProgress.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-metal-gray" />
              <span>📈 Progression</span>
              <span className="w-full h-px bg-metal-gray flex-1" />
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredProgress.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} />
              ))}
            </div>
          </div>
        )}

        {filteredPillar.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-metal-gray" />
              <span>🏛️ Maîtrise des Genres</span>
              <span className="w-full h-px bg-metal-gray flex-1" />
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredPillar.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modale de détail */}
      {selectedBadge && (
        <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}
    </>
  );
}
