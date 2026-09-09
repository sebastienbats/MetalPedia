'use client';

import { motion } from 'framer-motion';
import { useMemo, useRef, useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════
// FAMILLES DE SYMBOLES
// ═══════════════════════════════════════════════════════════

export const SYMBOL_FAMILIES = {
  /** ᚱ Les Tables du Savoir - Alphabet Futhark ancien */
  nordic: [
    'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 
    'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 
    'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'
  ],

  /** ♪ Le Premier Riff - Notes et symboles musicaux */
  musical: [
    '♩', '♪', '♫', '♬', '♭', '♮', '♯', 
    '𝄞', '𝄢', '𝄡', '𝄦', '𝄩', '𝄪', '𝄫'
  ],

  /** ✦ Le Silence Primordial - Symboles cosmiques */
  cosmic: [
    '✦', '✧', '★', '☆', '✶', '✴', '✹', '✵', 
    '✷', '✸', '☄', '✺', '✯', '✰', '✡', '✵'
  ],

  /** ☉ La magie des Anciens - Symboles alchimiques */
  alchemical: [
    '☉', '☽', '♁', '♂', '♀', '☿', '♃', '♄', 
    '⚕', '⚗', '⚚', '🜁', '🜂', '🜃', '🜄', '🜔'
  ],

  /** ☥ Les sortilèges - Symboles mystiques */
  occult: [
    '☯', '☸', '✡', '☥', '⛤', '⚕', '☬', '☫',
    '☪', '✝', '☦', '⚚', '♅', '♆', '♇', '⚝'
  ],

  /** ⚔ La quête du Métalleux - Armes médiévales */
  medieval: [
    '⚔', '⚒', '⚓', '⛏', '🗡', '🏹', '🛡', '⚜',
    '🔱', '⚑', '⚐', '✠', '☨', '⛨', '⚚', '⛓'
  ],

  /** △ Les forces primordiales - Éléments géométriques */
  elements: [
    '△', '▽', '▷', '◁', '◇', '○', '□', '⬡',
    '⬢', '⬣', '⬤', '⬥', '⬦', '⬧', '⬨', '⬩'
  ],

  /** ☠ L'Oubli et la Corruption - Symboles de mort */
  death: [
    '☠', '⚰', '⚱', '🜝', '🜞', '🜟', '🜠', '🜡',
    '🜢', '🜣', '🜤', '🜥', '🜦', '🜧', '🜨', '🜩'
  ],

  /** ♈ Les constellations - Signes astrologiques */
  celestial: [
    '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
    '♐', '♑', '♒', '♓', '⛎', '☉', '☽', '★'
  ],

  /** 🌙 Pilier Black Metal - Ténèbres et occultisme */
  black: [
    '🌙', '☽', '☾', '⛧', '⚰', '✟', '☠', '⛤',
    '✞', '☥', '♰', '♱', '⛥', '⛦', '🜤', '🜠'
  ],

  /** ⚡ Pilier Thrash Metal - Vitesse et violence */
  thrash: [
    '⚡', '⚔', '💀', '🔥', '☠', '⚡', '⛓', '⛏',
    '⚒', '🗡', '⚑', '⚐', '☄', '✴', '✹', '✦'
  ],

  /** 🌲 Pilier Folk Metal - Nature et traditions */
  folk: [
    '🌲', '☘', '🍃', '⚔', '♪', '♫', 'ᚠ', 'ᚱ',
    'ᛊ', 'ᛏ', 'ᛟ', '☘', '⚘', '❦', '❧', '✤'
  ],

  /** ✨ Le Metalverse complet - Mélange de toutes les familles */
  mixed: [
    'ᚠ', 'ᚦ', 'ᚱ', 'ᛟ', '♪', '♫', '𝄞', '♩',
    '✦', '★', '✶', '☄', '☉', '☽', '♂', '♀',
    '☯', '☥', '⛤', '⚔', '⚒', '🗡', '△', '◇',
    '♈', '♌', '♏', '♓', '🌙', '⚡', '🌲', '☘'
  ],
} as const;

export type SymbolFamily = keyof typeof SYMBOL_FAMILIES;

// ═══════════════════════════════════════════════════════════
// PROFILS PRÊTS À L'EMPLOI
// ═══════════════════════════════════════════════════════════

export const RUNE_PRESETS = {
  /** Dense et rapide - Nuage de symboles qui traversent rapidement */
  rain: {
    count: 60,
    maxScale: 5,
    baseDuration: 8,
    colorClass: 'text-amber-400',
    opacityFactor: 0.10,
    boundaryFactor: 0.95,
    family: 'mixed' as SymbolFamily,
  },
  
  /** Lent et majestueux - Grossissement spectaculaire */
  vortex: {
    count: 30,
    maxScale: 10,
    baseDuration: 20,
    colorClass: 'text-amber-300',
    opacityFactor: 0.15,
    boundaryFactor: 0.85,
    family: 'cosmic' as SymbolFamily,
  },
  
  /** Subtil et apaisant - Quelques symboles discrets */
  breeze: {
    count: 15,
    maxScale: 4,
    baseDuration: 18,
    colorClass: 'text-amber-500',
    opacityFactor: 0.08,
    boundaryFactor: 0.7,
    family: 'musical' as SymbolFamily,
  },
  
  /** Intense et envahissant - Magie déchaînée */
  storm: {
    count: 80,
    maxScale: 8,
    baseDuration: 6,
    colorClass: 'text-amber-200',
    opacityFactor: 0.20,
    boundaryFactor: 0.98,
    family: 'mixed' as SymbolFamily,
  },
  
  /** 📜 Équilibré pour le Grimoire - Dense mais contenu */
  parchment: {
    count: 40,
    maxScale: 7,
    baseDuration: 14,
    colorClass: 'text-amber-300',
    opacityFactor: 0.15,
    boundaryFactor: 0.9,
    family: 'nordic' as SymbolFamily,
  },

  /** 🎵 Le Premier Riff - Notes de musique flottantes */
  firstRiff: {
    count: 35,
    maxScale: 6,
    baseDuration: 12,
    colorClass: 'text-yellow-300',
    opacityFactor: 0.18,
    boundaryFactor: 0.9,
    family: 'musical' as SymbolFamily,
  },

  /** 🌌 Le Silence Primordial - Étoiles et cosmos */
  primordialSilence: {
    count: 50,
    maxScale: 5,
    baseDuration: 16,
    colorClass: 'text-blue-300',
    opacityFactor: 0.12,
    boundaryFactor: 0.95,
    family: 'cosmic' as SymbolFamily,
  },

  /** ☉ La magie des Anciens - Symboles alchimiques */
  ancientMagic: {
    count: 30,
    maxScale: 8,
    baseDuration: 18,
    colorClass: 'text-purple-300',
    opacityFactor: 0.14,
    boundaryFactor: 0.85,
    family: 'alchemical' as SymbolFamily,
  },

  /** ☠ L'Oubli - Symboles sombres et corruption */
  oblivion: {
    count: 45,
    maxScale: 7,
    baseDuration: 14,
    colorClass: 'text-red-400',
    opacityFactor: 0.12,
    boundaryFactor: 0.9,
    family: 'death' as SymbolFamily,
  },

  /** ⚔ La Quête - Armes et batailles */
  quest: {
    count: 35,
    maxScale: 6,
    baseDuration: 12,
    colorClass: 'text-orange-300',
    opacityFactor: 0.16,
    boundaryFactor: 0.9,
    family: 'medieval' as SymbolFamily,
  },

  /** ♈ Les Constellations - Destin et astrologie */
  constellations: {
    count: 25,
    maxScale: 5,
    baseDuration: 20,
    colorClass: 'text-indigo-300',
    opacityFactor: 0.14,
    boundaryFactor: 0.85,
    family: 'celestial' as SymbolFamily,
  },
} as const;

export type PresetName = keyof typeof RUNE_PRESETS;

// ═══════════════════════════════════════════════════════════
// INTERFACE DU COMPOSANT
// ═══════════════════════════════════════════════════════════

interface FloatingRunesProps {
  preset?: PresetName;           // Nom du profil prédéfini
  family?: SymbolFamily;         // 🆕 Famille de symboles
  count?: number;                // Override : Nombre de symboles actifs
  maxScale?: number;             // Override : Facteur de grossissement max
  baseDuration?: number;         // Override : Durée de base (secondes)
  colorClass?: string;           // Override : Classe Tailwind couleur
  opacityFactor?: number;        // Override : Opacité maximale (0-1)
  boundaryFactor?: number;       // Override : Facteur de limite (0-1)
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

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
  
  // 🎯 Fusion : preset d'abord, puis overrides individuels, puis valeurs par défaut
  const presetConfig = preset ? RUNE_PRESETS[preset] : {};
  
  const finalConfig = {
    count: count ?? presetConfig.count ?? 25,
    maxScale: maxScale ?? presetConfig.maxScale ?? 7,
    baseDuration: baseDuration ?? presetConfig.baseDuration ?? 12,
    colorClass: colorClass ?? presetConfig.colorClass ?? 'text-amber-400',
    opacityFactor: opacityFactor ?? presetConfig.opacityFactor ?? 0.12,
    boundaryFactor: boundaryFactor ?? presetConfig.boundaryFactor ?? 0.9,
    family: family ?? presetConfig.family ?? 'nordic',
  };

  // 🆕 Sélection de la famille de symboles
  const symbols = SYMBOL_FAMILIES[finalConfig.family];

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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
