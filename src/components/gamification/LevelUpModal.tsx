'use client';

import { useEffect } from 'react';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getRankForLevel } from '@/lib/gamification/lore';

export default function LevelUpModal() {
  const { showLevelUpModal, pendingLevelUp, closeLevelUpModal } = useGamificationStore();

  useEffect(() => {
    if (showLevelUpModal) {
      // Confetti ou animation ici
      const timer = setTimeout(() => {
        // Auto-fermeture après 5s
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUpModal]);

  if (!showLevelUpModal || !pendingLevelUp) return null;

  const rank = getRankForLevel(pendingLevelUp);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={closeLevelUpModal}
    >
      <div
        className="relative max-w-md w-full text-center p-8 rounded-2xl border-2 animate-pulse"
        style={{
          borderColor: rank.color,
          backgroundColor: '#0a0a0a',
          boxShadow: `0 0 60px ${rank.color}60, 0 0 120px ${rank.color}30`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Effet de rayons */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-spin"
            style={{
              animationDuration: '10s',
              background: `conic-gradient(from 0deg, transparent, ${rank.color}20, transparent, ${rank.color}20, transparent)`,
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="text-7xl mb-4 animate-bounce">{rank.icon}</div>

          <h2
            className="font-metal text-4xl mb-2"
            style={{ color: rank.color }}
          >
            LEVEL UP !
          </h2>

          <p className="text-2xl font-serif mb-4">
            Niveau {pendingLevelUp}
          </p>

          <div
            className="inline-block px-4 py-2 rounded-full mb-4 text-lg font-bold"
            style={{
              backgroundColor: `${rank.color}20`,
              color: rank.color,
              border: `2px solid ${rank.color}`,
            }}
          >
            {rank.title}
          </div>

          <p className="text-gray-400 italic mb-6">{rank.description}</p>

          <button
            onClick={closeLevelUpModal}
            className="metal-button px-8 py-3 text-lg"
          >
            ⚔️ Continuer la quête
          </button>
        </div>
      </div>
    </div>
  );
}
