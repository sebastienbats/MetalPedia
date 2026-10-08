'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import LoreGrimoire from './LoreGrimoire';

export default function GrimoireTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 📖 BOUTON DÉCLENCHEUR */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          y: [0, -5, 0],
        }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" } 
        }}
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-metal-black border-2 border-amber-700/50 shadow-[0_0_15px_rgba(180,83,9,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:border-amber-500 transition-all duration-300"
        title="Ouvrir le Grimoire des Anciens"
      >
        <span className="text-3xl filter drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all">
          📜
        </span>
        
        {/* Petit indicateur de notification (optionnel) */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-metal-fire rounded-full animate-pulse" />
      </motion.button>

      {/* 🌌 MODALE DU GRIMOIRE */}
      <LoreGrimoire isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
