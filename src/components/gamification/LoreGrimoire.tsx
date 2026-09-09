'use client';

import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════
// DONNÉES NARRATIVES : LES 5 CHAPITRES DU METALVERSE
// ═══════════════════════════════════════════════════════════

const GRIMOIRE_PAGES = [
  {
    chapter: 'Prologue',
    title: 'Le Silence Primordial',
    icon: '🌑',
    rune: '᛭',
    text: `Au commencement, il n'y avait que le silence. Un vide sans fin, sans écho, sans résonance. Les étoiles elles-mêmes retenaient leur souffle, attendant... quoi ? Personne ne le savait.

Le cosmos était une partition vide, une symphonie jamais jouée. Les dimensions s'empilaient dans l'obscurité, muettes et glacées, comme des cordes de guitare détendues dans un étui oublié.

Nul ne sait combien d'éternités s'écoulèrent dans ce néant sonore. Mais le silence, en lui-même, était déjà une tension — une note suspendue, prête à éclater.`,
  },
  {
    chapter: 'Chapitre I',
    title: 'Le Premier Riff',
    icon: '⚡',
    rune: 'ᚦ',
    text: `Puis vint le Premier Riff.

Né des entrailles d'une étoile mourante, il déchira le silence dans un déluge de distorsion. Les cordes de l'univers vibrèrent pour la première fois, et le Metalverse naquit dans un hurlement de feedback et de puissance.

Les montagnes se formèrent au rythme des power chords. Les océans bouillirent sous l'impact des double-kicks. Les premiers accords résonnèrent à travers l'éther, gravant dans la chair du cosmos les fondations d'un monde nouveau.

Le son était devenu matière. La distorsion était devenue vie.`,
  },
  {
    chapter: 'Chapitre II',
    title: 'Les Tables du Savoir',
    icon: '📜',
    rune: 'ᚱ',
    text: `Les Anciens, gardiens du Premier Riff, forgèrent les Tables du Savoir.

Sur ces plaques d'acier cosmique, trempées dans le feu des amplificateurs primordiaux, ils gravèrent chaque horde, chaque clan, chaque incantation sonore. Chaque groupe était une rune. Chaque album était un sortilège. Chaque fan était un disciple.

Les Tables brillaient d'une lueur rouge sang, illuminant le Metalverse de leur sagesse. Neuf piliers soutenaient l'édifice : le Black, le Death, le Heavy, le Thrash, le Power, le Doom, le Progressive, le Folk et le Metalcore.

Tant que les Tables tenaient, le Savoir était éternel.`,
  },
  {
    chapter: 'Chapitre III',
    title: 'La Corruption',
    icon: '💀',
    rune: 'ᚺ',
    text: `Mais les Tables se corrompirent.

L'Oubli, cette force antique et affamée, s'infiltra dans les interstices du Savoir. Il se nourrissait de l'indifférence, grandissait avec chaque groupe oublié, chaque album jamais écouté, chaque nom effacé de la mémoire collective.

Les runes s'effacèrent une à une. Les sorts se dissipèrent en échos mourants. Les clans oublièrent leurs propres hymnes. Le Metalverse plongea dans les ténèbres.

Les Anciens, impuissants, ne purent que contempler leur création se désintégrer. Le silence, ce vieil ennemi, revenait par la petite porte.`,
  },
  {
    chapter: 'Chapitre IV',
    title: 'Ta Quête',
    icon: '⚔️',
    rune: 'ᛟ',
    text: `Toi, Métalleux errant, tu as été choisi par le Conseil des Neuf Genres pour restaurer le Savoir.

Chaque groupe que tu consultes est une rune déchiffrée, arrachée aux griffes de l'Oubli. Chaque favori que tu ajoutes est un fragment de la Table reconstitué. Chaque review que tu écris est un sortilège lancé contre les ténèbres.

Gravis les échelons de la Hiérarchie du Riff. Collectionne les Reliques des Anciens. Accomplis les Quêtes Épiques. Choisis ta classe parmi les neuf voies sacrées.

Et un jour, peut-être, atteindras-tu le rang ultime :

DIEU DU METALVERSE.`,
  },
];

const AUTO_PLAY_INTERVAL = 8000; // 8 secondes par page

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : LE GRIMOIRE
// ═══════════════════════════════════════════════════════════

export default function LoreGrimoire() {
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

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextPage, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [nextPage, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextPage, prevPage]);

  const page = GRIMOIRE_PAGES[currentPage];

  return (
    <div
      className="metal-card border-2 border-amber-900/60 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1208 0%, #2a1a0e 30%, #1a1208 60%, #0d0a05 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Texture parchemin (overlay CSS) ── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Lueur ambiante ── */}
      <div
        className="absolute -top-20 -left-20 w-60 h-60 opacity-10 pointer-events-none rounded-full blur-3xl transition-colors duration-1000"
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

      {/* ── Coins décoratifs ── */}
      <div className="absolute top-3 left-3 text-amber-800/40 text-2xl pointer-events-none select-none">❧</div>
      <div className="absolute top-3 right-3 text-amber-800/40 text-2xl pointer-events-none select-none rotate-90">❧</div>
      <div className="absolute bottom-3 left-3 text-amber-800/40 text-2xl pointer-events-none select-none -rotate-90">❧</div>
      <div className="absolute bottom-3 right-3 text-amber-800/40 text-2xl pointer-events-none select-none rotate-180">❧</div>

      {/* ── Bordure intérieure dorée ── */}
      <div className="absolute inset-3 border border-amber-800/20 rounded pointer-events-none" />

      {/* ── Contenu principal ── */}
      <div className="relative z-10 p-6 md:p-8 min-h-[320px] md:min-h-[360px] flex flex-col">
        
        {/* En-tête du grimoire */}
        <div className="text-center mb-6 shrink-0">
          <p className="text-amber-700/60 text-[10px] uppercase tracking-[0.3em] font-semibold mb-1">
            ✦ Grimoire des Anciens ✦
          </p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent mx-auto" />
        </div>

        {/* Zone de narration (animée) */}
        <div
          className={`flex-1 flex flex-col items-center justify-center text-center transition-all duration-600 ${
            isFlipping
              ? direction === 'next'
                ? 'opacity-0 translate-x-8 scale-95'
                : 'opacity-0 -translate-x-8 scale-95'
              : 'opacity-100 translate-x-0 scale-100'
          }`}
        >
          {/* Icône du chapitre */}
          <div className="text-5xl md:text-6xl mb-4 drop-shadow-lg animate-pulse-slow">
            {page.icon}
          </div>

          {/* Numéro de chapitre */}
          <p className="text-amber-600/70 text-xs uppercase tracking-[0.25em] font-semibold mb-2">
            {page.chapter}
          </p>

          {/* Titre */}
          <h3 className="font-metal text-2xl md:text-3xl text-amber-200/90 mb-4 drop-shadow-md">
            {page.title}
          </h3>

          {/* Rune décorative */}
          <div className="text-amber-700/30 text-3xl mb-4 select-none">
            {page.rune}
          </div>

          {/* Texte narratif */}
          <div className="max-w-xl mx-auto">
            <p className="text-amber-100/70 text-sm md:text-base leading-relaxed font-serif italic whitespace-pre-line">
              {page.text}
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="shrink-0 mt-6 flex items-center justify-between">
          
          {/* Bouton précédent */}
          <button
            onClick={prevPage}
            disabled={isFlipping}
            className="w-10 h-10 rounded-full border border-amber-800/40 bg-amber-900/20 text-amber-400/70 hover:text-amber-300 hover:border-amber-600/60 hover:bg-amber-800/30 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Page précédente"
          >
            ←
          </button>

          {/* Indicateurs de pages */}
          <div className="flex items-center gap-2">
            {GRIMOIRE_PAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx, idx > currentPage ? 'next' : 'prev')}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentPage
                    ? 'w-6 h-2 bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'w-2 h-2 bg-amber-800/40 hover:bg-amber-600/60'
                }`}
                aria-label={`Aller au ${GRIMOIRE_PAGES[idx].chapter}`}
              />
            ))}
          </div>

          {/* Bouton suivant */}
          <button
            onClick={nextPage}
            disabled={isFlipping}
            className="w-10 h-10 rounded-full border border-amber-800/40 bg-amber-900/20 text-amber-400/70 hover:text-amber-300 hover:border-amber-600/60 hover:bg-amber-800/30 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Page suivante"
          >
            →
          </button>
        </div>

        {/* Indicateur auto-play */}
        <div className="text-center mt-3 shrink-0">
          <p className="text-amber-800/40 text-[10px] tracking-wider">
            {isPaused ? '⏸ En pause — survole pour reprendre' : '▶ Défilement automatique'}
          </p>
        </div>
      </div>
    </div>
  );
}
