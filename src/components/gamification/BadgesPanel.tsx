'use client';

import { BADGES, getBadgeRarityColor } from '@/lib/gamification/badges';
import { useGamificationStore } from '@/stores/gamificationStore';

export default function BadgesPanel() {
  const { stats } = useGamificationStore();
  const unlockedCount = stats.badgesUnlocked.length;

  return (
    <div className="metal-card p-6">
      <header className="mb-6">
        <h3 className="font-serif text-2xl mb-1">🏅 Reliques des Anciens</h3>
        <p className="text-sm text-gray-400">
          {unlockedCount}/{BADGES.length} reliques collectionnées
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {BADGES.map((badge) => {
          const isUnlocked = stats.badgesUnlocked.includes(badge.id);
          const rarityColor = getBadgeRarityColor(badge.rarity);

          return (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border transition-all ${
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
                <div className="text-sm font-semibold mb-1">{badge.name}</div>
                <div
                  className="text-xs px-2 py-0.5 rounded-full inline-block"
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
