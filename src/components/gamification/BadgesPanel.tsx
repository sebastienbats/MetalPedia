'use client';

import { useState } from 'react';
import { BADGES, getBadgeRarityColor } from '@/lib/gamification/badges';
import { useGamificationStore } from '@/stores/gamificationStore';
import { RARITY_CONFIG } from '@/stores/notificationStore';

// ═══════════════════════════════════════════════════════════
// MODALE DE DÉTAIL DE LA RELIQUE
// ═══════════════════════════════════════════════════════════
function RelicModal({ badge, onClose }: { badge: typeof BADGES[0]; onClose: () => void }) {
  const isUnlocked = useGamificationStore((s) => s.stats.badgesUnlocked.includes(badge.id));
  const rarityColor = getBadgeRarityColor(badge.rarity);
  const config = RARITY_CONFIG[badge.rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md metal-card border-2 p-6 animate-slide-up"
        style={{ borderColor: rarityColor }}
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
          <h3 className="font-metal text-2xl mb-2 break-words" style={{ color: isUnlocked ? rarityColor : '#666' }}>
            {badge.name}
          </h3>
          <div 
            className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded inline-block"
            style={{ backgroundColor: `${rarityColor}20`, color: rarityColor, border: `1px solid ${rarityColor}40` }}
          >
            {config.medal} {badge.rarity.toUpperCase()}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed text-center">
            {badge.description}
          </p>
          
          {badge.lore && (
            <div className="p-3 bg-metal-black/50 rounded border border-metal-gray/50">
              <p className="text-xs text-gray-400 italic text-center leading-relaxed">
                "{badge.lore}"
              </p>
            </div>
          )}

          {!isUnlocked && (
            <div className="text-center pt-2 border-t border-metal-gray/50">
              <span className="text-xs text-gray-500">🔒 Cette relique est encore cachée dans les ténèbres...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function BadgesPanel() {
  const { stats } = useGamificationStore();
  const [selectedBadge, setSelectedBadge] = useState<typeof BADGES[0] | null>(null);
  const unlockedCount = stats.badgesUnlocked.length;

  return (
    <>
      <div className="metal-card p-2 sm:p-3">
        <header className="mb-2">
          <h3 className="font-serif text-lg sm:text-xl mb-1">🏅 Reliques des Anciens</h3>
          <p className="text-xs text-gray-400">
            {unlockedCount}/{BADGES.length} reliques
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {BADGES.map((badge) => {
            const isUnlocked = stats.badgesUnlocked.includes(badge.id);
            const rarityColor = getBadgeRarityColor(badge.rarity);

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`relative p-2 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
                  isUnlocked
                    ? 'bg-metal-dark'
                    : 'bg-metal-black/50 opacity-40 grayscale'
                }`}
                style={{
                  borderColor: isUnlocked ? rarityColor : '#2a2a2a',
                  boxShadow: isUnlocked ? `0 0 15px ${rarityColor}30` : 'none',
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <div className="text-xs font-semibold mb-1 break-words px-1 leading-tight">
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <span className="text-xl">🔒</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modale de détail */}
      {selectedBadge && (
        <RelicModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}
    </>
  );
}
