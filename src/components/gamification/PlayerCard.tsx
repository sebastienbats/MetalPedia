'use client';

import { useGamificationStore } from '@/stores/gamificationStore';
import { getRankForLevel, RANKS } from '@/lib/gamification/lore';

export default function PlayerCard() {
  const { stats } = useGamificationStore();
  const progress = useGamificationStore((s) => s.getLevelProgress());
  const unlockedBadges = useGamificationStore((s) => s.getUnlockedBadges());

  const nextRank = RANKS.find((r) => r.level > stats.level);

  return (
    <div className="metal-card p-6">
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4"
          style={{
            borderColor: progress.currentRank.color,
            backgroundColor: `${progress.currentRank.color}15`,
            boxShadow: `0 0 20px ${progress.currentRank.color}40`,
          }}
        >
          {progress.currentRank.icon}
        </div>
        <div>
          <h2 className="font-metal text-2xl" style={{ color: progress.currentRank.color }}>
            {progress.currentRank.title}
          </h2>
          <p className="text-gray-400">Niveau {stats.level}</p>
          {nextRank && (
            <p className="text-xs text-gray-500 mt-1">
              Prochain rang : {nextRank.title} (Niv. {nextRank.level})
            </p>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-metal-black/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-metal-fire">{stats.totalViews}</div>
          <div className="text-xs text-gray-400">Groupes vus</div>
        </div>
        <div className="bg-metal-black/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-metal-fire">{stats.totalFavorites}</div>
          <div className="text-xs text-gray-400">Favoris</div>
        </div>
        <div className="bg-metal-black/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-metal-fire">{stats.totalReviews}</div>
          <div className="text-xs text-gray-400">Reviews</div>
        </div>
        <div className="bg-metal-black/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-metal-fire">{unlockedBadges.length}</div>
          <div className="text-xs text-gray-400">Reliques</div>
        </div>
      </div>

      {/* Progression XP */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">XP Total : {stats.totalXP.toLocaleString()}</span>
          <span className="text-metal-fire">
            {progress.nextLevelXP === Infinity
              ? 'NIVEAU MAX'
              : `Prochain niveau : ${progress.nextLevelXP.toLocaleString()} XP`
            }
          </span>
        </div>
        <div className="h-4 bg-metal-gray rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-700 rounded-full"
            style={{
              width: `${progress.progress}%`,
              background: `linear-gradient(90deg, ${progress.currentRank.color}, ${progress.currentRank.color}cc)`,
              boxShadow: `0 0 15px ${progress.currentRank.color}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
