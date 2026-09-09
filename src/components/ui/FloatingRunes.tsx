'use client';

import { motion } from 'framer-motion';
import { useMemo, useRef, useEffect, useState } from 'react';

export const SYMBOL_FAMILIES = {
  musical: ['♩', '♪', '♫', '♬', '♭', '♮', '♯', '𝄞', '𝄢', '𝄡', '𝄦', '𝄩', '𝄪', '𝄫'],
  nordic: ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'],
  mixed: ['ᚠ', 'ᚦ', 'ᚱ', 'ᛟ', '♪', '♫', '𝄞', '♩', '✦', '★', '✶', '☄', '☉', '☽', '♂', '♀', '☯', '☥', '⛤', '⚔', '⚒', '🗡', '△', '◇', '♈', '♌', '♏', '♓', '🌙', '⚡', '🌲', '☘'],
} as const;

export type SymbolFamily = keyof typeof SYMBOL_FAMILIES;

export const RUNE_PRESETS = {
  storm: { count: 80, maxScale: 8, baseDuration: 6, colorClass: 'text-amber-200', opacityFactor: 0.20, boundaryFactor: 0.98, family: 'mixed' as SymbolFamily },
  firstRiff: { count: 35, maxScale: 6, baseDuration: 12, colorClass: 'text-yellow-300', opacityFactor: 0.18, boundaryFactor: 0.9, family: 'musical' as SymbolFamily },
} as const;

export type PresetName = keyof typeof RUNE_PRESETS;

interface FloatingRunesProps {
  preset?: PresetName;
  family?: SymbolFamily;
  count?: number;
  maxScale?: number;
  baseDuration?: number;
  colorClass?: string;
  opacityFactor?: number;
  boundaryFactor?: number;
}

export default function FloatingRunes({
  preset,
  family,
  count,
  maxScale,
  baseDuration,
  colorClass,
  opacityFactor,
  boundaryFactor,
}: FloatingRunesProps) {
  
  const finalConfig = useMemo(() => {
    const presetConfig = preset ? RUNE_PRESETS[preset] : undefined;
    return {
      count: count ?? presetConfig?.count ?? 25,
      maxScale: maxScale ?? presetConfig?.maxScale ?? 7,
      baseDuration: baseDuration ?? presetConfig?.baseDuration ?? 12,
      colorClass: colorClass ?? presetConfig?.colorClass ?? 'text-amber-400',
      opacityFactor: opacityFactor ?? presetConfig?.opacityFactor ?? 0.12,
      boundaryFactor: boundaryFactor ?? presetConfig?.boundaryFactor ?? 0.9,
      family: (family ?? presetConfig?.family ?? 'nordic') as SymbolFamily,
    };
  }, [preset, family, count, maxScale, baseDuration, colorClass, opacityFactor, boundaryFactor]);

  const symbols = SYMBOL_FAMILIES[finalConfig.family];
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1000 
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: finalConfig.count }).map((_, i) => {
      const endX = (Math.random() - 0.5) * dimensions.width * finalConfig.boundaryFactor;
      const endY = (Math.random() - 0.5) * dimensions.height * finalConfig.boundaryFactor;
      const targetScale = 0.4 + Math.random() * (finalConfig.maxScale - 0.4);
      const duration = finalConfig.baseDuration + Math.random() * 8;
      const delay = Math.random() * 15;

      return {
        id: i,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        endX,
        endY,
        targetScale,
        duration,
        delay,
      };
    });
  }, [finalConfig, dimensions, symbols]);

  return (
    <>
      {/* 🚨 BADGE DE DÉBOGAGE INCONTESTABLE 🚨 */}
      <div className="fixed top-4 right-4 bg-red-600 text-white p-3 z-[9999] font-mono text-xs font-bold rounded shadow-lg border-2 border-white">
        DEBUG: FloatingRunes ACTIF<br/>
        Particules: {particles.length}<br/>
        Dimensions: {dimensions.width}x{dimensions.height}
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
            animate={{ 
              x: p.endX,
              y: p.endY,
              scale: p.targetScale,
              opacity: [0, finalConfig.opacityFactor, finalConfig.opacityFactor, 0] 
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.1, 0.8, 1] 
            }}
            // 🚨 AJOUT D'UN FOND SOLIDE TEMPORAIRE POUR GARANTIR LA VISIBILITÉ
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold text-6xl md:text-7xl ${finalConfig.colorClass} bg-white/10 rounded-full p-2`}
            style={{ willChange: 'transform, opacity' }}
          >
            {p.symbol}
          </motion.div>
        ))}
      </div>
    </>
  );
}
