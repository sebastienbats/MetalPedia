'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Alphabet Futhark ancien pour l'authenticité
const NORDIC_RUNES = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 
  'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 
  'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'
];

interface FloatingRunesProps {
  count?: number;          // Nombre de runes actives simultanément (défaut: 25)
  maxScale?: number;       // Facteur de grossissement max (défaut: 7)
  baseDuration?: number;   // Durée de base de l'animation en secondes (défaut: 12)
  colorClass?: string;     // Classe Tailwind pour la couleur (défaut: 'text-amber-400')
  opacityFactor?: number;  // Opacité de base (défaut: 0.12 pour un effet filigrane visible)
}

export default function FloatingRunes({
  count = 25,
  maxScale = 7,
  baseDuration = 12,
  colorClass = 'text-amber-400',
  opacityFactor = 0.12,
}: FloatingRunesProps) {
  
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // 🚀 Distance étendue : entre -150% et +150% pour traverser largement le cadre
      const endX = (Math.random() - 0.5) * 300; 
      const endY = (Math.random() - 0.5) * 300;
      
      // 📏 Échelle plus agressive : commence à 0.4 (visible) et va jusqu'à maxScale
      const targetScale = 0.4 + Math.random() * (maxScale - 0.4);
      
      // ⏱️ Durée plus lente et majestueuse
      const duration = baseDuration + Math.random() * 8; // ex: entre 12s et 20s
      const delay = Math.random() * 15; // Décalage initial pour éviter les vagues synchronisées

      return {
        id: i,
        rune: NORDIC_RUNES[Math.floor(Math.random() * NORDIC_RUNES.length)],
        endX,
        endY,
        targetScale,
        duration,
        delay,
      };
    });
  }, [count, maxScale, baseDuration]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: '0%', 
            y: '0%', 
            scale: 0.4, // Départ visible
            opacity: 0 
          }}
          animate={{ 
            x: `${p.endX}%`, 
            y: `${p.endY}%`, 
            scale: p.targetScale,
            // 🎭 Keyframes d'opacité optimisées : 
            // 0%: invisible (centre)
            // 10%: visible (commence à grossir)
            // 80%: encore visible (proche du bord)
            // 100%: disparaît (hors du cadre)
            opacity: [0, opacityFactor, opacityFactor, 0] 
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
            // On peut aussi ajouter des keyframes pour l'opacité si besoin, 
            // mais le tableau ci-dessus gère déjà les étapes.
            // Pour un contrôle total des étapes d'opacité, on utilise times:
            times: [0, 0.1, 0.8, 1] 
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold text-4xl md:text-5xl ${colorClass}`}
          style={{
            willChange: 'transform, opacity',
          }}
        >
          {p.rune}
        </motion.div>
      ))}
    </div>
  );
}
