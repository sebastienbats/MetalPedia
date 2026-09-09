'use client';

import { motion } from 'framer-motion';
import { useMemo, useRef, useEffect, useState } from 'react';

export const SYMBOL_FAMILIES = {
  nordic: ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'],
  musical: ['♩', '♪', '♫', '♬', '♭', '♮', '♯', '𝄞', '𝄢', '𝄡', '𝄦', '𝄩', '𝄪', '𝄫'],
  cosmic: ['✦', '✧', '★', '☆', '✶', '✴', '✹', '✵', '✷', '✸', '☄', '✺', '✯', '✰', '✡'],
  alchemical: ['☉', '☽', '♁', '♂', '♀', '☿', '♃', '♄', '⚕', '⚗', '⚚', '🜁', '🜂', '🜃', '🜄', '🜔'],
  occult: ['☯', '☸', '✡', '☥', '⛤', '⚕', '☬', '☫', '☪', '✝', '☦', '⚚', '♅', '♆', '♇', '⚝'],
  medieval: ['⚔', '⚒', '⚓', '⛏', '🗡', '🏹', '🛡', '⚜', '🔱', '⚑', '⚐', '✠', '☨', '⛨', '⚚', '⛓'],
  elements: ['△', '▽', '▷', '◁', '◇', '○', '□', '⬡', '⬢', '⬣', '⬤', '⬥', '⬦', '⬧', '⬨', '⬩'],
  death: ['☠', '⚰', '⚱', '🜝', '🜞', '🜟', '🜠', '🜡', '🜢', '🜣', '🜤', '🜥', '🜦', '🜧', '🜨', '🜩'],
  celestial: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '☉', '☽', '★'],
  black: ['🌙', '☽', '☾', '⛧', '⚰', '✟', '☠', '⛤', '✞', '☥', '♰', '♱', '⛥', '⛦', '🜤', '🜠'],
  thrash: ['⚡', '⚔', '💀', '🔥', '☠', '⚡', '⛓', '⛏', '⚒', '🗡', '⚑', '⚐', '☄', '✴', '✹', '✦'],
  folk: ['🌲', '☘', '🍃', '⚔', '♪', '♫', 'ᚠ', 'ᚱ', 'ᛊ', 'ᛏ', 'ᛟ', '☘', '⚘', '❦', '❧', '✤'],
  mixed: ['ᚠ', 'ᚦ', 'ᚱ', 'ᛟ', '♪', '♫', '𝄞', '♩', '✦', '★', '✶', '☄', '☉', '☽', '♂', '♀', '☯', '☥', '⛤', '⚔', '⚒', '🗡', '△', '◇', '♈', '♌', '♏', '♓', '🌙', '⚡', '🌲', '☘'],
} as const;

export type SymbolFamily = keyof typeof SYMBOL_FAMILIES;

export const RUNE_PRESETS = {
  rain: { count: 60, maxScale: 5, baseDuration: 8, colorClass: 'text-amber-400', opacityFactor: 0.10, boundaryFactor: 0.95, family: 'mixed' as SymbolFamily },
  vortex: { count: 30, maxScale: 10, baseDuration: 20, colorClass: 'text-amber-300', opacityFactor: 0.15, boundaryFactor: 0.85, family: 'cosmic' as SymbolFamily },
  breeze: { count: 15, maxScale: 4, baseDuration: 18, colorClass: 'text-amber-500', opacityFactor: 0.08, boundaryFactor: 0.7, family: 'musical' as SymbolFamily },
  storm: { count: 80, maxScale: 8, baseDuration: 6, colorClass: 'text-amber-200', opacityFactor: 0.20, boundaryFactor: 0.98, family: 'mixed' as SymbolFamily },
  parchment: { count: 40, maxScale: 7, baseDuration: 14, colorClass: 'text-amber-300', opacityFactor: 0.15, boundaryFactor: 0.9, family: 'nordic' as SymbolFamily },
  firstRiff: { count: 35, maxScale: 6, baseDuration: 12, colorClass: 'text-yellow-300', opacityFactor: 0.18, boundaryFactor: 0.9, family: 'musical' as SymbolFamily },
  primordialSilence: { count: 50, maxScale: 5, baseDuration: 16, colorClass: 'text-blue-300', opacityFactor: 0.12, boundaryFactor: 0.95, family: 'cosmic' as SymbolFamily },
  ancientMagic: { count: 30, maxScale: 8, baseDuration: 18, colorClass: 'text-purple-300', opacityFactor: 0.14, boundaryFactor: 0.85, family: 'alchemical' as SymbolFamily },
  oblivion: { count: 45, maxScale: 7, baseDuration: 14, colorClass: 'text-red-400', opacityFactor: 0.12, boundaryFactor: 0.9, family: 'death' as SymbolFamily },
  quest: { count: 35, maxScale: 6, baseDuration: 12, colorClass: 'text-orange-300', opacityFactor: 0.16, boundaryFactor: 0.9, family: 'medieval' as SymbolFamily },
  constellations: { count: 25, maxScale: 5, baseDuration: 20, colorClass: 'text-indigo-300', opacityFactor: 0.14, boundaryFactor: 0.85, family: 'celestial' as SymbolFamily },
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 🛡️ CORRECTION CRUCIALE : Utiliser window.innerWidth comme fallback immédiat
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1000 
  });

  useEffect(() => {
    const updateDimensions = () => {
      // On prend les dimensions du conteneur, OU celles de la fenêtre si le conteneur est à 0
      const width = containerRef.current?.offsetWidth || window.innerWidth;
      const height = containerRef.current?.offsetHeight || window.innerHeight;
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const particles = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];

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

  // 🐍 LOG DE DÉBOGAGE : Ouvre la console (F12) pour vérifier que les particules sont générées
  useEffect(() => {
    console.log(`[FloatingRunes] Dimensions: ${dimensions.width}x${dimensions.height}, Particules: ${particles.length}`);
  }, [dimensions.width, dimensions.height, particles.length]);

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
            opacity: [0, finalConfig.opacityFactor, finalConfig.opacityFactor, 0] 
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.1, 0.8, 1] 
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold text-4xl md:text-5xl ${finalConfig.colorClass}`}
          style={{
            willChange: 'transform, opacity',
          }}
        >
          {p.symbol}
        </motion.div>
      ))}
    </div>
  );
}
