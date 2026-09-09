'use client';

import { motion } from 'framer-motion';
import { useMemo, useRef, useEffect, useState } from 'react';

const NORDIC_RUNES = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 
  'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 
  'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'
];

interface FloatingRunesProps {
  count?: number;
  maxScale?: number;
  baseDuration?: number;
  colorClass?: string;
  opacityFactor?: number;
}

export default function FloatingRunes({
  count = 25,
  maxScale = 7,
  baseDuration = 12,
  colorClass = 'text-amber-400',
  opacityFactor = 0.12,
}: FloatingRunesProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 🆕 Mesure la taille réelle du conteneur parent
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 🆕 Génération des particules basée sur les dimensions réelles
  const particles = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];

    return Array.from({ length: count }).map((_, i) => {
      // 🚀 Déplacements en pixels basés sur la taille du parent (150% pour dépasser largement les bords)
      const endX = (Math.random() - 0.5) * dimensions.width * 1.5;
      const endY = (Math.random() - 0.5) * dimensions.height * 1.5;
      
      const targetScale = 0.4 + Math.random() * (maxScale - 0.4);
      const duration = baseDuration + Math.random() * 8;
      const delay = Math.random() * 15;

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
  }, [count, maxScale, baseDuration, dimensions]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0.4,
            opacity: 0 
          }}
          animate={{ 
            x: p.endX,
            y: p.endY,
            scale: p.targetScale,
            opacity: [0, opacityFactor, opacityFactor, 0] 
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
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
