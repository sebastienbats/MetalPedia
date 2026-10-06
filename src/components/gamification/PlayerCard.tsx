'use client';

import { useGamificationStore } from '@/stores/gamificationStore';
import { useFavoritesCount } from '@/stores/favoritesStore'; // ✅ AJOUT : Source de vérité unique pour les favoris
import { useAuth } from '@/api/authApi';
import { RANKS } from '@/lib/gamification/lore';

export default function PlayerCard() {
  const { data: user } = useAuth();
  
  // ✅ 1. Écouter l'état de chargement global (déclenché par le Header)
  const isLoading = useGamificationStore((s) => s.isLoadingCloud);
  
  // ✅ 2. Lire le nombre de favoris DIRECTEMENT depuis le store des favoris (comme le Header)
  const favCount = useFavoritesCount();

  // ✅ 3. Utiliser des sélecteurs précis pour les autres stats de gamification
  const stats = useGamificationStore((s) => s.stats);
  const progress = useGamificationStore((s) => s.getLevelProgress());
  const unlockedBadges = useGamificationStore((s) => s.getUnlockedBadges());

  const nextRank = RANKS.find((r) => r.level > stats.level);

  // ✅ 4. Gérer l'état non connecté
  if (!user) {
    return (
      <div className="metal-card p-6 border-2 border-metal-gray text-center">
        <p className="text-gray-400">Connecte-toi pour voir ta progression et débloquer des reliques.</p>
      </div>
    );
  }

  // ✅ 5. Afficher un état de chargement pendant la synchro cloud
  if (isLoading) {
    return (
      <div className="metal-card p-6 border-2 border-metal-gray animate-pulse">
        <div className="h-4 bg-metal-gray/50 rounded w-1/3 mb-6"></div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-metal-gray/50"></div>
          <div className="flex-1">
            <div className="h-6 bg-metal-gray/50 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-metal-gray/50 rounded w-1/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-metal-gray/50 rounded-lg"></div>
          ))}
        </div>
        <div className="h-4 bg-metal-gray/50 rounded-full w-full"></div>
      </div>
    );
  }

  // ✅ 6. Affichage des données réelles
  return (
    <div className="metal-card p-1.5 border-2 border-metal-gray">
      <div className="mb-4 flex items-center gap-2">
        <span className="px-2 py-1 bg-metal-gray/30 text-gray-300 text-[10px] font-bold rounded uppercase tracking-wider border border-metal-gray">
          🌍 Progression Globale
        </span>
        <span className="text-xs text-gray-500 italic">Augmente avec toutes tes actions</span>
      </div>

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
          <p className="text-gray-400 font-semibold">Niveau {stats.level}</p>
          {nextRank && (
            <p className="text-xs text-gray-500 mt-1">
              Prochain rang : {nextRank.title} (Niv. {nextRank.level})
            </p>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-metal-black/50 rounded-lg p-3 text-center border border-metal-gray/30">
          <div className="text-2xl font-bold text-metal-fire">{stats.totalViews}</div>
          <div className="text-xs text-gray-400">Groupes vus</div>
        </div>
        
        {/* ✅ CORRECTION : Utilisation de favCount au lieu de stats.totalFavorites */}
        <div className="bg-metal-black/50 rounded-lg p-3 text-center border border-metal-gray/30">
          <div className="text-2xl font-bold text-metal-fire">{favCount}</div>
          <div className="text-xs text-gray-400">Favoris</div>
        </div>

        <div className="bg-metal-black/50 rounded-lg p-3 text-center border border-metal-gray/30">
          <div className="text-2xl font-bold text-metal-fire">{stats.totalReviews}</div>
          <div className="text-xs text-gray-400">Reviews</div>
        </div>
        <div className="bg-metal-black/50 rounded-lg p-3 text-center border border-metal-gray/30">
          <div className="text-2xl font-bold text-metal-fire">{unlockedBadges.length}</div>
          <div className="text-xs text-gray-400">Reliques</div>
        </div>
      </div>

      {/* Progression XP */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">XP Total : {stats.totalXP.toLocaleString('fr-FR')}</span>
          <span className="text-metal-fire font-medium">
            {progress.nextLevelXP === Infinity
              ? 'NIVEAU MAX'
              : `Prochain niveau : ${progress.nextLevelXP.toLocaleString('fr-FR')} XP`
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
