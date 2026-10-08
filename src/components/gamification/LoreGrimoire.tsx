'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GRIMOIRE_PAGES = [
  {
    chapter: 'Prologue',
    title: 'Le Silence Primordial',
    icon: '🌑',
    rune: '᛭',
    text: `Au commencement, il n'y avait que le silence. Un vide sans fin, sans écho, sans résonance. Les étoiles elles-mêmes retenaient leur souffle, attendant... quoi ? Personne ne le savait.\n\nLe cosmos était une partition vide, une symphonie jamais jouée. Les dimensions s'empilaient dans l'obscurité, muettes et glacées, comme des cordes de guitare détendues dans un étui oublié.\n\nNul ne sait combien d'éternités s'écoulèrent dans ce néant sonore. Mais le silence, en lui-même, était déjà une tension — une note suspendue, prête à éclater.`,
  },
  {
    chapter: 'Chapitre I',
    title: 'Le Premier Riff',
    icon: '⚡',
    rune: 'ᚦ',
    text: `Puis vint le Premier Riff.\n\nNé des entrailles d'une étoile mourante, il déchira le silence dans un déluge de distorsion. Les cordes de l'univers vibrèrent pour la première fois, et le Metalverse naquit dans un hurlement de feedback et de puissance.\n\nLes montagnes se formèrent au rythme des power chords. Les océans bouillirent sous l'impact des double-kicks. Les premiers accords résonnèrent à travers l'éther, gravant dans la chair du cosmos les fondations d'un monde nouveau.\n\nLe son était devenu matière. La distorsion était devenue vie.`,
  },
  {
    chapter: 'Chapitre II',
    title: 'Les Tables du Savoir',
    icon: '📜',
    rune: 'ᚱ',
    text: `Les Anciens, gardiens du Premier Riff, forgèrent les Tables du Savoir.\n\nSur ces plaques d'acier cosmique, trempées dans le feu des amplificateurs primordiaux, ils gravèrent chaque horde, chaque clan, chaque incantation sonore. Chaque groupe était une rune. Chaque album était un sortilège. Chaque fan était un disciple.\n\nLes Tables brillaient d'une lueur rouge sang, illuminant le Metalverse de leur sagesse. Neuf piliers soutenaient l'édifice : le Black, le Death, le Heavy, le Thrash, le Power, le Doom, le Progressive, le Folk et le Metalcore.\n\nTant que les Tables tenaient, le Savoir était éternel.`,
  },
  {
    chapter: 'Chapitre III',
    title: 'La Corruption',
    icon: '💀',
    rune: 'ᚺ',
    text: `Mais les Tables se corrompirent.\n\nL'Oubli, cette force antique et affamée, s'infiltra dans les interstices du Savoir. Il se nourrissait de l'indifférence, grandissait avec chaque groupe oublié, chaque album jamais écouté, chaque nom effacé de la mémoire collective.\n\nLes runes s'effacèrent une à une. Les sorts se dissipèrent en échos mourants. Les clans oublièrent leurs propres hymnes. Le Metalverse plongea dans les ténèbres.\n\nLes Anciens, impuissants, ne purent que contempler leur création se désintégrer. Le silence, ce vieil ennemi, revenait par la petite porte.`,
  },
  {
    chapter: 'Chapitre IV',
    title: 'Ta Quête',
    icon: '⚔️',
    rune: 'ᛟ',
    text: `Toi, Métalleux errant, tu as été choisi par le Conseil des Neuf Genres pour restaurer le Savoir.\n\nChaque groupe que tu consultes est une rune déchiffrée, arrachée aux griffes de l'Oubli. Chaque favori que tu ajoutes est un fragment de la Table reconstitué. Chaque review que tu écris est un sortilège lancé contre les ténèbres.\n\nGravis les échelons de la Hiérarchie du Riff. Collectionne les Reliques des Anciens. Accomplis les Quêtes Épiques. Choisis ta classe parmi les neuf voies sacrées.\n\nEt un jour, peut-être, atteindras-tu le rang ultime :\n\nDIEU DU METALVERSE.`,
  },
];

const AUTO_PLAY_INTERVAL = 8000;

export interface LoreGrimoireProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoreGrimoire({ isOpen, onClose }: LoreGrimoireProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isPaused, setIsPaused] = useState(false);

  const totalPages = GRIMOIRE_PAGES.length;

  const goToPage = useCallback(
    (targetPage: number, dir: 'next' | 'prev') => {
      if (isFlipping || targetPage === currentPage) return;
      if (targetPage < 0 || targetPage >= totalPages) return;

      setDirection(dir);
      setIsFlipping(true);

      setTimeout(() => {
        setCurrentPage(targetPage);
        setIsFlipping(false);
      }, 600);
    },
    [isFlipping, currentPage, totalPages]
  );

  const nextPage = useCallback(() => {
    const next = currentPage < totalPages - 1 ? currentPage + 1 : 0;
    goToPage(next, 'next');
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    const prev = currentPage > 0 ? currentPage - 1 : totalPages - 1;
    goToPage(prev, 'prev');
  }, [currentPage, totalPages, goToPage]);

  useEffect(() => {
    if (isPaused || !isOpen) return;
    const timer = setInterval(nextPage, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [nextPage, isPaused, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, nextPage, prevPage, onClose]);

  const page = GRIMOIRE_PAGES[currentPage];

  return (
    <AnimatePresence>
      {isOpen && (
        // ✅ ZÉRO DÉCALAGE : p-0 partout, items-start pour coller en haut
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/95 backdrop-blur-md p-0"
          onClick={onClose}
        >
          {/* ✅ CONTENEUR : h-full pour occuper 100% de la hauteur */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full h-full md:max-w-4xl overflow-hidden flex flex-col shadow-2xl shadow-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex flex-col h-full w-full border-2 md:border-4 border-amber-900/60 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 18, 8, 0.98) 0%, rgba(42, 26, 14, 0.98) 30%, rgba(26, 18, 8, 0.98) 60%, rgba(13, 10, 5, 0.98) 100%)',
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 md:top-4 md:right-4 z-30 w-9 h-9 md:w-11 md:h-11 rounded-full border border-amber-800/40 bg-amber-900/30 text-amber-400/70 hover:text-amber-200 hover:border-amber-500/60 hover:bg-amber-800/50 transition-all flex items-center justify-center text-lg md:text-xl"
                aria-label="Fermer le grimoire"
              >
                ✕
              </button>

              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                }}
              />

              <div
                className="absolute -top-20 -left-20 w-40 h-40 md:w-80 md:h-80 opacity-15 pointer-events-none rounded-full blur-3xl transition-colors duration-1000"
                style={{
                  background: `radial-gradient(circle, ${
                    currentPage === 0 ? '#6b7280' :
                    currentPage === 1 ? '#ef4444' :
                    currentPage === 2 ? '#f59e0b' :
                    currentPage === 3 ? '#7c3aed' :
                    '#ef4444'
                  } 0%, transparent 70%)`,
                }}
              />

              <div className="absolute top-2 left-2 md:top-3 md:left-3 text-amber-800/40 text-xl md:text-3xl pointer-events-none select-none">❧</div>
              <div className="absolute top-2 right-2 md:top-3 md:right-3 text-amber-800/40 text-xl md:text-3xl pointer-events-none select-none rotate-90">❧</div>
              <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-amber-800/40 text-xl md:text-3xl pointer-events-none select-none -rotate-90">❧</div>
              <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 text-amber-800/40 text-xl md:text-3xl pointer-events-none select-none rotate-180">❧</div>
              <div className="absolute inset-2 md:inset-4 border border-amber-800/20 rounded pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full p-3 md:p-8 overflow-hidden">
                
                <div className="text-center mb-1 md:mb-3 shrink-0">
                  <p className="text-amber-700/60 text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-semibold">
                    ✦ Grimoire des Anciens ✦
                  </p>
                  <div className="w-32 md:w-48 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent mx-auto mt-1" />
                </div>

                <div
                  className={`flex-1 flex flex-col items-center justify-center text-center transition-all duration-600 overflow-hidden ${
                    isFlipping
                      ? direction === 'next'
                        ? 'opacity-0 translate-x-8 scale-95'
                        : 'opacity-0 -translate-x-8 scale-95'
                      : 'opacity-100 translate-x-0 scale-100'
                  }`}
                >
                  <div className="text-3xl md:text-5xl mb-1 md:mb-2 drop-shadow-lg animate-pulse-slow">
                    {page.icon}
                  </div>

                  <p className="text-amber-600/70 text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">
                    {page.chapter}
                  </p>

                  <h3 className="font-metal text-lg md:text-2xl text-amber-200/90 mb-1 md:mb-3 drop-shadow-md">
                    {page.title}
                  </h3>

                  <div className="text-amber-700/30 text-xl md:text-2xl mb-1 md:mb-3 select-none">
                    {page.rune}
                  </div>

                  <div className="max-w-xl mx-auto w-full px-2">
                    <p className="text-amber-100/80 text-[11px] md:text-xs leading-snug md:leading-normal font-serif italic whitespace-pre-line">
                      {page.text}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-1 md:mt-4 flex items-center justify-between">
                  <button
                    onClick={prevPage}
                    disabled={isFlipping}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-amber-800/40 bg-amber-900/20 text-amber-400/70 hover:text-amber-200 hover:border-amber-500/60 hover:bg-amber-800/40 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-sm md:text-lg"
                  >
                    ←
                  </button>

                  <div className="flex items-center gap-2">
                    {GRIMOIRE_PAGES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToPage(idx, idx > currentPage ? 'next' : 'prev')}
                        className={`transition-all duration-300 rounded-full ${
                          idx === currentPage
                            ? 'w-5 md:w-6 h-1.5 bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : 'w-1.5 h-1.5 bg-amber-800/40 hover:bg-amber-600/60'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={isFlipping}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-amber-800/40 bg-amber-900/20 text-amber-400/70 hover:text-amber-200 hover:border-amber-500/60 hover:bg-amber-800/40 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-sm md:text-lg"
                  >
                    →
                  </button>
                </div>

                <div className="text-center mt-1 md:mt-2 shrink-0">
                  <p className="text-amber-800/50 text-[9px] md:text-[10px] tracking-widest uppercase">
                    {isPaused ? '⏸ Lecture en pause' : '▶ Défilement automatique'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
