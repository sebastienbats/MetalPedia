'use client';

import { BADGES, getBadgeRarityColor } from '@/lib/gamification/badges';
import { useGamificationStore } from '@/stores/gamificationStore';

export default function BadgesPanel() {
  const { stats } = useGamificationStore();
  const unlockedCount = stats.badgesUnlocked.length;

  return (
    <div className="metal-card p-1.5">
      <header className="mb-1.5">
        <h3 className="font-serif text-xl mb-0.5">🏅 Reliques des Anciens</h3>
        <p className="text-xs text-gray-400">
          {unlockedCount}/{BADGES.length} reliques
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
        {BADGES.map((badge) => {
          const isUnlocked = stats.badgesUnlocked.includes(badge.id);
          const rarityColor = getBadgeRarityColor(badge.rarity);

          return (
            <div
              key={badge.id}
              className={`relative p-1 rounded-lg border transition-all ${
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
                <div className="text-2xl mb-1">{badge.icon}</div>
                <div className="text-xs font-semibold mb-0.5 truncate px-1">
                  {badge.name}
                </div>
                <div
                  className="text-[10px] px-1 py-0.5 rounded-full inline-block"
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
                  <span className="text-xl">🔒</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
