'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════
// DONNÉES NARRATIVES : LES 5 CHAPITRES DU METALVERSE
// ═══════════════════════════════════════════════════════════
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

export interface LoreGrimoireProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoreGrimoire({ isOpen, onClose }: LoreGrimoireProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isPaused, setIsPaused] = useState(false);

  // ✅ RÉFÉRENCES POUR L'AUTO-SCROLL
  const textContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = GRIMOIRE_PAGES.length;

  const clearScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const goToPage = useCallback(
    (targetPage: number, dir: 'next' | 'prev') => {
      if (isFlipping || targetPage === currentPage) return;
      if (targetPage < 0 || targetPage >= totalPages) return;

      clearScroll();
      setDirection(dir);
      setIsFlipping(true);

      setTimeout(() => {
        setCurrentPage(targetPage);
        setIsFlipping(false);
      }, 600);
    },
    [isFlipping, currentPage, totalPages, clearScroll]
  );

  const nextPage = useCallback(() => {
    const next = currentPage < totalPages - 1 ? currentPage + 1 : 0;
    goToPage(next, 'next');
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    const prev = currentPage > 0 ? currentPage - 1 : totalPages - 1;
    goToPage(prev, 'prev');
  }, [currentPage, totalPages, goToPage]);

  // ✅ LOGIQUE D'AUTO-SCROLL (4x PLUS LENTE)
  useEffect(() => {
    clearScroll();
    if (!isOpen) return;
    
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }

    if (isPaused) return;

    const startScrollTimeout = setTimeout(() => {
      if (isPaused) return;

      scrollIntervalRef.current = setInterval(() => {
        if (isPaused || !textContainerRef.current) return;

        const el = textContainerRef.current;
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 2;

        if (isAtBottom) {
          clearScroll();
          setTimeout(() => {
            nextPage();
          }, 3000);
        } else {
          el.scrollTop += 1;
        }
      }, 100);
    }, 2000);

    return () => {
      clearTimeout(startScrollTimeout);
      clearScroll();
    };
  }, [currentPage, isOpen, isPaused, clearScroll, nextPage]);

  // Navigation clavier
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          // ✅ !mt-0 conservé comme demandé
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-0 md:p-6 !mt-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full h-full md:max-w-4xl md:h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ✨ HALO MAGIQUE : Ombre multi-couches (externe + interne) + bordure plus lumineuse */}
            <div
              className="flex flex-col h-full w-full border-2 md:border-[3px] border-amber-500/40 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 18, 8, 0.98) 0%, rgba(42, 26, 14, 0.98) 30%, rgba(26, 18, 8, 0.98) 60%, rgba(13, 10, 5, 0.98) 100%)',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.4), 0 0 50px rgba(245, 158, 11, 0.2), 0 0 75px rgba(245, 158, 11, 0.1), inset 0 0 20px rgba(245, 158, 11, 0.3)'
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 md:top-4 md:right-4 z-30 w-9 h-9 md:w-11 md:h-11 rounded-full border border-amber-500/40 bg-amber-900/40 text-amber-300 hover:text-amber-100 hover:border-amber-400 hover:bg-amber-800/60 transition-all flex items-center justify-center text-lg md:text-xl shadow-[0_0_10px_rgba(245,158,11,0.5)]"
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
                className="absolute -top-20 -left-20 w-40 h-40 md:w-80 md:h-80 opacity-20 pointer-events-none rounded-full blur-3xl transition-colors duration-1000"
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

              <div className="absolute top-2 left-2 md:top-3 md:left-3 text-amber-500/50 text-xl md:text-3xl pointer-events-none select-none drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">❧</div>
              <div className="absolute top-2 right-2 md:top-3 md:right-3 text-amber-500/50 text-xl md:text-3xl pointer-events-none select-none rotate-90 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">❧</div>
              <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-amber-500/50 text-xl md:text-3xl pointer-events-none select-none -rotate-90 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">❧</div>
              <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 text-amber-500/50 text-xl md:text-3xl pointer-events-none select-none rotate-180 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">❧</div>
              
              {/* Bordure intérieure subtile pour renforcer l'effet de profondeur */}
              <div className="absolute inset-1.5 md:inset-2.5 border border-amber-500/20 rounded pointer-events-none shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]" />

              <div className="relative z-10 flex flex-col h-full p-3 md:p-8">
                
                <div className="text-center mb-2 md:mb-4 shrink-0">
                  <p className="text-amber-400/80 text-xs md:text-sm uppercase tracking-[0.3em] font-semibold drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                    ✦ Grimoire des Anciens ✦
                  </p>
                  <div className="w-48 md:w-64 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-2 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                </div>

                <div
                  ref={textContainerRef}
                  className={`flex-1 flex flex-col items-center text-center transition-all duration-600 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                    isFlipping
                      ? direction === 'next'
                        ? 'opacity-0 translate-x-8 scale-95'
                        : 'opacity-0 -translate-x-8 scale-95'
                      : 'opacity-100 translate-x-0 scale-100'
                  }`}
                >
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse-slow mt-2">
                    {page.icon}
                  </div>

                  <p className="text-amber-400/80 text-xs md:text-sm uppercase tracking-[0.25em] font-semibold mb-2">
                    {page.chapter}
                  </p>

                  <h3 className="font-metal text-xl md:text-3xl text-amber-100 mb-2 md:mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    {page.title}
                  </h3>

                  <div className="text-amber-500/60 text-2xl md:text-3xl mb-2 md:mb-4 select-none drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                    {page.rune}
                  </div>

                  <div className="max-w-2xl mx-auto w-full px-4 pb-24">
                    <p className="text-amber-100/90 text-sm md:text-base leading-relaxed md:leading-loose font-serif italic whitespace-pre-line drop-shadow-sm">
                      {page.text}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-2 md:mt-6 flex items-center justify-between">
                  <button
                    onClick={prevPage}
                    disabled={isFlipping}
                    className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-amber-500/40 bg-amber-900/30 text-amber-300 hover:text-amber-100 hover:border-amber-400 hover:bg-amber-800/50 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-base md:text-xl shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  >
                    ←
                  </button>

                  <div className="flex items-center gap-2 md:gap-3">
                    {GRIMOIRE_PAGES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToPage(idx, idx > currentPage ? 'next' : 'prev')}
                        className={`transition-all duration-300 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.3)] ${
                          idx === currentPage
                            ? 'w-6 md:w-8 h-1.5 md:h-2 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                            : 'w-1.5 md:w-2 h-1.5 md:h-2 bg-amber-700/50 hover:bg-amber-500/80'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={isFlipping}
                    className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-amber-500/40 bg-amber-900/30 text-amber-300 hover:text-amber-100 hover:border-amber-400 hover:bg-amber-800/50 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-base md:text-xl shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  >
                    →
                  </button>
                </div>

                <div className="text-center mt-2 md:mt-3 shrink-0">
                  <p className="text-amber-500/60 text-[10px] md:text-xs tracking-widest uppercase">
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
