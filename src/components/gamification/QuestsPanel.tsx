'use client';

import { QUESTS, DIFFICULTY_COLORS } from '@/lib/gamification/quests';
import { useGamificationStore } from '@/stores/gamificationStore';

export default function QuestsPanel() {
  const { stats } = useGamificationStore();
  const activeQuests = useGamificationStore((s) => s.getActiveQuests());
  const completedQuests = useGamificationStore((s) => s.getCompletedQuests());

  return (
    <div className="metal-card p-1.5">
      <header className="mb-2">
        <h3 className="font-serif text-xl mb-1">📜 Journal des Quêtes</h3>
        <p className="text-xs text-gray-400">
          {completedQuests.length}/{QUESTS.length} quêtes accomplies
        </p>
      </header>

      {/* Quêtes actives */}
      <div className="space-y-1 mb-2">
        <h4 className="text-xs font-semibold text-metal-fire uppercase tracking-wide mb-1">
          Quêtes en cours
        </h4>
        {activeQuests.slice(0, 5).map((quest) => {
          const progress = getQuestProgress(quest, stats);
          const difficultyColor = DIFFICULTY_COLORS[quest.difficulty];

          return (
            <div
              key={quest.id}
              className="p-1 rounded-lg bg-metal-black/50 border border-metal-gray hover:border-metal-fire transition-colors"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="text-xl shrink-0">{quest.icon}</span>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-sm truncate">{quest.name}</h5>
                    <p className="text-xs text-gray-400 line-clamp-2">{quest.description}</p>
                    <p className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-1">{quest.lore}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${difficultyColor}20`,
                      color: difficultyColor,
                    }}
                  >
                    {quest.difficulty.toUpperCase()}
                  </div>
                  <div className="text-xs text-metal-fire mt-0.5">+{quest.xpReward} XP</div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-1 h-1.5 bg-metal-gray rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-metal-blood to-metal-rust transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quêtes complétées */}
      {completedQuests.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">
            ✓ Quêtes accomplies
          </h4>
          <div className="space-y-1">
            {completedQuests.map((quest) => (
              <div
                key={quest.id}
                className="flex items-center gap-1.5 p-1 rounded-lg bg-green-900/20 border border-green-800/30"
              >
                <span className="text-lg shrink-0">{quest.icon}</span>
                <span className="text-xs line-through text-gray-400 truncate flex-1">{quest.name}</span>
                <span className="text-green-400 text-xs shrink-0">+{quest.xpReward} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getQuestProgress(quest: typeof QUESTS[0], stats: any): number {
  const { type, target } = quest.requirements;
  let current = 0;

  switch (type) {
    case 'views': current = stats.totalViews; break;
    case 'favorites': current = stats.totalFavorites; break;
    case 'reviews': current = stats.totalReviews; break;
    case 'genres': current = stats.genresExplored.length; break;
  }

  return Math.min(100, (current / target) * 100);
}
