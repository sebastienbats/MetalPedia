'use client';

import { useGamificationStore } from '@/stores/gamificationStore';
import { getRankForLevel } from '@/lib/gamification/lore';

export default function XPBar() {
  const { stats } = useGamificationStore();
  const progress = useGamificationStore((s) => s.getLevelProgress());

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-metal-black/95 border-t border-metal-gray backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center gap-4">
          {/* Avatar + Level */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
              style={{
                borderColor: progress.currentRank.color,
                backgroundColor: `${progress.currentRank.color}20`,
              }}
            >
              {progress.currentRank.icon}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: progress.currentRank.color }}>
                Niv. {progress.currentLevel}
              </div>
              <div className="text-xs text-gray-400">{progress.currentRank.title}</div>
            </div>
          </div>

          {/* Barre d'XP */}
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{stats.totalXP.toLocaleString()} XP</span>
              <span>{progress.nextLevelXP === Infinity ? 'MAX' : `${progress.nextLevelXP.toLocaleString()} XP`}</span>
            </div>
            <div className="h-3 bg-metal-gray rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${progress.progress}%`,
                  background: `linear-gradient(to right, ${progress.currentRank.color}, ${progress.currentRank.color}dd)`,
                  boxShadow: `0 0 10px ${progress.currentRank.color}80`,
                }}
              />
            </div>
          </div>

          {/* Raccourci profil */}
          <a
            href="/profile"
            className="metal-button text-sm px-3 py-2"
          >
            👤 Profil
          </a>
        </div>
      </div>
    </div>
  );
}
