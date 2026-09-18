'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

// ═══════════════════════════════════════════════════════════
// CONFETTIS (particules légères sans lib externe)
// ═══════════════════════════════════════════════════════════
function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    emoji: ['✨', '🎉', '🔥', '⚔️', '🏆', '💫'][Math.floor(Math.random() * 6)],
    size: 12 + Math.random() * 16,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute confetti-particle"
          style={{
            left: `${p.left}%`,
            top: '-40px',
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function CelebrationOverlay() {
  const celebration = useNotificationStore((s) => s.activeCelebration);
  const closeCelebration = useNotificationStore((s) => s.closeCelebration);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (celebration) {
      setIsVisible(true);
      // Auto-close après 8s
      const timer = setTimeout(() => handleClose(), 8000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [celebration]);

  if (!celebration) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(closeCelebration, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Confettis */}
      <Confetti />

      {/* Carte de célébration */}
      <div
        className={`celebration-card relative max-w-lg w-full text-center transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Halo lumineux */}
        <div className="absolute inset-0 celebration-halo" aria-hidden="true" />

        <div className="relative z-10 p-8 md:p-10">
          {/* Icône géante */}
          <div className="text-8xl mb-4 celebration-icon">
            {celebration.icon}
          </div>

          {/* Titre */}
          <h2 className="font-metal text-3xl md:text-4xl text-yellow-400 mb-2 celebration-title">
            {celebration.title}
          </h2>

          {/* Sous-titre */}
          <p className="text-gray-300 text-base md:text-lg mb-6 font-serif italic">
            {celebration.subtitle}
          </p>

          {/* Stats si Table complète */}
          {celebration.fragmentsCollected && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/40 rounded-full mb-6">
              <span className="text-yellow-400">📜</span>
              <span className="text-yellow-300 font-bold">
                {celebration.fragmentsCollected} fragments gravés
              </span>
            </div>
          )}

          {/* Bouton fermer */}
          <div>
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-gradient-to-r from-metal-fire to-red-700 text-white font-metal rounded-lg hover:scale-105 transition-transform shadow-lg shadow-metal-fire/40"
            >
              ⚔️ Continuer la Légende
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
