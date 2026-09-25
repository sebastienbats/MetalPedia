'use client';

import { BADGES, getBadgeRarityColor } from '@/lib/gamification/badges';
import { useGamificationStore } from '@/stores/gamificationStore';

export default function BadgesPanel() {
  const { stats } = useGamificationStore();
  const unlockedCount = stats.badgesUnlocked.length;

  return (
    <div className="metal-card p-2 sm:p-3">
      <header className="mb-2">
        <h3 className="font-serif text-lg sm:text-xl mb-1">🏅 Reliques des Anciens</h3>
        <p className="text-xs text-gray-400">
          {unlockedCount}/{BADGES.length} reliques
        </p>
      </header>

      {/* ✅ Grille en liste sur mobile (grid-cols-1), puis 2 ou 3 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {BADGES.map((badge) => {
          const isUnlocked = stats.badgesUnlocked.includes(badge.id);
          const rarityColor = getBadgeRarityColor(badge.rarity);

          return (
            <div
              key={badge.id}
              className={`relative p-2 sm:p-3 rounded-lg border transition-all ${
                isUnlocked
                  ? 'bg-metal-dark hover:scale-105'
                  : 'bg-metal-black/50 opacity-40 grayscale'
              }`}
              style={{
                borderColor: isUnlocked ? rarityColor : '#2a2a2a',
                boxShadow: isUnlocked ? `0 0 15px ${rarityColor}30` : 'none',
              }}
              title={isUnlocked ? badge.lore : badge.description}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{badge.icon}</div>
                {/* ✅ break-words au lieu de truncate pour le nom */}
                <div className="text-sm font-semibold mb-1 break-words px-1 leading-tight">
                  {badge.name}
                </div>
                <div
                  className="text-[10px] px-1.5 py-0.5 rounded-full inline-block"
                  style={{
                    backgroundColor: `${rarityColor}20`,
                    color: rarityColor,
                  }}
                >
                  {badge.rarity.toUpperCase()}
                </div>
              </div>

              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
