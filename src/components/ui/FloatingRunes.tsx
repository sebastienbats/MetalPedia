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
  count?: number;          // Nombre de runes actives simultanément (défaut: 15)
  maxScale?: number;       // Facteur de grossissement max (défaut: 5)
  baseDuration?: number;   // Durée de base de l'animation en secondes (défaut: 8)
  colorClass?: string;     // Classe Tailwind pour la couleur (défaut: 'text-amber-500')
  opacityFactor?: number;  // Opacité de base (défaut: 0.08 pour un effet filigrane)
}

export default function FloatingRunes({
  count = 15,
  maxScale = 5,
  baseDuration = 8,
  colorClass = 'text-amber-500',
  opacityFactor = 0.08,
}: FloatingRunesProps) {
  
  // Génération mémorisée des particules pour éviter les re-rendus inutiles
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Direction aléatoire depuis le centre (entre -120% et +120% pour sortir du cadre)
      const endX = (Math.random() - 0.5) * 240; 
      const endY = (Math.random() - 0.5) * 240;
      
      // Échelle aléatoire entre 0.1 (départ) et maxScale (arrivée)
      const targetScale = 0.1 + Math.random() * (maxScale - 0.1);
      
      // Durée et délai aléatoires pour créer des "vagues" organiques
      const duration = baseDuration + Math.random() * 6; // ex: entre 8s et 14s
      const delay = Math.random() * 10; // Décalage initial aléatoire

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
          // Position de départ : centre exact
          initial={{ 
            x: '0%', 
            y: '0%', 
            scale: 0.1, 
            opacity: 0 
          }}
          // Position d'arrivée : bords aléatoires avec grossissement
          animate={{ 
            x: `${p.endX}%`, 
            y: `${p.endY}%`, 
            scale: p.targetScale,
            // L'opacité monte vite, reste stable, puis disparaît à la fin pour un effet de fondu propre
            opacity: [0, opacityFactor, opacityFactor, 0] 
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            // L'astuce pour le mouvement non-rectiligne : des courbes de bézier différentes pour X et Y
            // ou utiliser "easeInOut" qui crée naturellement une accélération/décélération douce
            ease: "easeInOut", 
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold ${colorClass}`}
          style={{
            // Optimisation des performances GPU
            willChange: 'transform, opacity',
          }}
        >
          {p.rune}
        </motion.div>
      ))}
    </div>
  );
}
