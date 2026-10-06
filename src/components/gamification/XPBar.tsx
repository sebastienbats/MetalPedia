'use client';

import { useState, useEffect } from 'react';
import { useGamificationStore } from '@/stores/gamificationStore';

export default function XPBar() {
  const stats = useGamificationStore((s) => s.stats);
  const progress = useGamificationStore((s) => s.getLevelProgress());
  
  // 🛡️ 1. État pour savoir si le composant est monté côté client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🛡️ 2. Valeurs de secours pour le rendu SSR / premier rendu client (doivent matcher le serveur)
  const displayXP = mounted ? stats.totalXP : 0;
  const displayNextXP = mounted ? (progress.nextLevelXP === Infinity ? 'MAX' : progress.nextLevelXP) : 0;
  const displayProgress = mounted ? progress.progress : 0;
  const displayColor = mounted ? progress.currentRank.color : '#6b7280'; // Gris par défaut
  const displayIcon = mounted ? progress.currentRank.icon : '🛡️';
  const displayLevel = mounted ? progress.currentLevel : 1;
  const displayTitle = mounted ? progress.currentRank.title : 'Novice';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-metal-black/95 border-t border-metal-gray backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center gap-4">
          {/* Avatar + Level */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
              style={{
                borderColor: displayColor,
                backgroundColor: `${displayColor}20`,
              }}
            >
              {displayIcon}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: displayColor }}>
                Niv. {displayLevel}
              </div>
              <div className="text-xs text-gray-400">{displayTitle}</div>
            </div>
          </div>

          {/* Barre d'XP */}
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{displayXP.toLocaleString('fr-FR')} XP</span>
              <span>
                {progress.nextLevelXP === Infinity 
                  ? 'MAX' 
                  : `${displayNextXP.toLocaleString('fr-FR')} XP`
                }
              </span>
            </div>
            <div className="h-3 bg-metal-gray rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  // 🛡️ 3. Application conditionnelle des styles dynamiques
                  width: mounted ? `${displayProgress}%` : '0%',
                  background: mounted 
                    ? `linear-gradient(to right, ${displayColor}, ${displayColor}dd)` 
                    : 'linear-gradient(to right, #6b7280, #6b7280dd)',
                  boxShadow: mounted ? `0 0 10px ${displayColor}80` : '0 0 10px #6b728080',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
