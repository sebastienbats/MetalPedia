'use client';

import { useEffect, useRef, useState } from 'react';
import Loader from '@/components/ui/Loader';

// ✅ IMPORT DIRECT DU CSS vis-timeline
// Next.js 15 gère nativement cet import (pas de config webpack custom)
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface TimelineEvent {
  id: number;
  content: string;
  start: string;
  end?: string;
  className?: string;
  type?: 'point' | 'range';
}

// ═══════════════════════════════════════════════════════════
// DONNÉES HISTORIQUES (60 ans de metal)
// ═══════════════════════════════════════════════════════════

const METAL_EVENTS: TimelineEvent[] = [
  // Naissance du metal
  { id: 1, content: '🎸 Formation de Black Sabbath', start: '1968-11-01', className: 'event-heavy' },
  { id: 2, content: '💿 Sortie de "Paranoid" (Black Sabbath)', start: '1970-09-18', className: 'event-heavy' },
  { id: 3, content: '🎤 Deep Purple - "Machine Head"', start: '1972-03-25', className: 'event-heavy' },
  { id: 4, content: '⚡ Led Zeppelin - "Houses of the Holy"', start: '1973-03-28', className: 'event-heavy' },

  // Ère classique
  { id: 5, content: '🔥 Judas Priest - "British Steel"', start: '1980-04-14', className: 'event-heavy' },
  { id: 6, content: '🎸 Iron Maiden - Formation', start: '1975-12-25', className: 'event-heavy' },
  { id: 7, content: '💿 Metallica - Formation', start: '1981-10-28', className: 'event-heavy' },

  // NWOBHM et Thrash
  { id: 8, content: '⚡ NWOBHM - Nouvelle vague du heavy britannique', start: '1979-01-01', end: '1983-12-31', type: 'range', className: 'event-heavy' },
  { id: 9, content: '🔥 Metallica - "Kill \'Em All"', start: '1983-07-25', className: 'event-heavy' },
  { id: 10, content: '💀 Slayer - "Reign in Blood"', start: '1986-10-07', className: 'event-heavy' },
  { id: 11, content: '⚡ Megadeth - "Peace Sells"', start: '1986-09-19', className: 'event-heavy' },
  { id: 12, content: '🎸 Anthrax - "Among the Living"', start: '1987-03-22', className: 'event-heavy' },

  // Death Metal
  { id: 13, content: '💀 Émergence du Death Metal (Floride)', start: '1983-01-01', end: '1990-12-31', type: 'range', className: 'event-black' },
  { id: 14, content: '💀 Death - "Scream Bloody Gore"', start: '1987-05-28', className: 'event-black' },
  { id: 15, content: '💀 Morbid Angel - "Altars of Madness"', start: '1989-05-12', className: 'event-black' },
  { id: 16, content: '💀 Cannibal Corpse - Formation', start: '1988-12-01', className: 'event-black' },

  // Black Metal
  { id: 17, content: '🌑 Première vague Black Metal', start: '1982-01-01', end: '1990-12-31', type: 'range', className: 'event-black' },
  { id: 18, content: '🌑 Seconde vague Black Metal norvégien', start: '1991-01-01', end: '1996-12-31', type: 'range', className: 'event-black' },
  { id: 19, content: '🌑 Mayhem - "De Mysteriis Dom Sathanas"', start: '1994-05-24', className: 'event-black' },
  { id: 20, content: '🌑 Darkthrone - "A Blaze in the Northern Sky"', start: '1992-02-26', className: 'event-black' },
  { id: 21, content: '🌑 Burzum - "Filosofem"', start: '1996-01-01', className: 'event-black' },

  // Power & Symphonic
  { id: 22, content: '🎻 Explosion du Power Metal européen', start: '1994-01-01', end: '2000-12-31', type: 'range', className: 'event-heavy' },
  { id: 23, content: '🎻 Helloween - "Keeper of the Seven Keys"', start: '1987-05-23', className: 'event-heavy' },
  { id: 24, content: '🎻 Blind Guardian - "Somewhere Far Beyond"', start: '1992-03-30', className: 'event-heavy' },
  { id: 25, content: '🎭 Nightwish - Formation', start: '1996-07-06', className: 'event-heavy' },

  // Nu Metal & Metalcore
  { id: 26, content: '🎤 Nu Metal - Ère mainstream', start: '1994-01-01', end: '2004-12-31', type: 'range', className: 'event-heavy' },
  { id: 27, content: '🎤 Korn - Premier album', start: '1994-10-11', className: 'event-heavy' },
  { id: 28, content: '🎤 System of a Down - "Toxicity"', start: '2001-09-04', className: 'event-heavy' },
  { id: 29, content: '🧟 Metalcore - Émergence', start: '2000-01-01', end: '2010-12-31', type: 'range', className: 'event-black' },
  { id: 30, content: '🧟 Killswitch Engage - "Alive or Just Breathing"', start: '2002-05-21', className: 'event-black' },

  // Ère moderne
  { id: 31, content: '🎼 Djent & Metal progressif moderne', start: '2005-01-01', end: '2015-12-31', type: 'range', className: 'event-heavy' },
  { id: 32, content: '🎼 Meshuggah - "Catch Thirtythree"', start: '2005-05-23', className: 'event-heavy' },
  { id: 33, content: '🎼 Periphery - Formation', start: '2005-01-01', className: 'event-heavy' },
  { id: 34, content: '🎭 Renaissance du Heavy Trad', start: '2015-01-01', end: '2026-01-01', type: 'range', className: 'event-heavy' },
  { id: 35, content: '🎸 Ghost - "Meliora"', start: '2015-08-21', className: 'event-heavy' },
];

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // ✅ CAPTURER la référence dans une variable locale
    // Cela garantit à TypeScript que container n'est pas null
    // même si le composant se démonte pendant l'await
    const container = containerRef.current;
    if (!container) return;

    let timeline: any = null;

    const initTimeline = async () => {
      try {
        const { Timeline, DataSet } = await import('vis-timeline/standalone');

        const items = new DataSet(METAL_EVENTS);

        const options = {
          height: '600px',
          start: '1970-01-01',
          end: '2026-01-01',
          min: '1960-01-01',
          max: '2026-12-31',
          zoomMin: 1000 * 60 * 60 * 24 * 365,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 50,
          margin: { item: 10 },
          orientation: 'top',
          stack: true,
          showCurrentTime: true,
          template: (item: TimelineEvent) => {
            return `<div class="timeline-item">${item.content}</div>`;
          },
        };

        // ✅ Utilisation de la variable locale 'container' (non-null garantie)
        timeline = new Timeline(container, items, options);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur initialisation timeline:', error);
        setIsLoading(false);
      }
    };

    initTimeline();

    return () => {
      if (timeline) {
        timeline.destroy();
      }
    };
  }, [mounted]);

  if (!mounted) {
    return <Loader text="Préparation de la timeline..." />;
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="metal-card p-4">
        {isLoading && <Loader text="Chargement de la timeline..." />}
        <div ref={containerRef} style={{ minHeight: '600px' }} />
      </div>

      {/* Légende */}
      <div className="metal-card p-5">
        <h3 className="font-serif text-lg mb-3">🎨 Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-metal-rust inline-block" />
            <span className="text-gray-400">Événements majeurs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-purple-800 inline-block" />
            <span className="text-gray-400">Black/Death Metal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-2 rounded bg-metal-fire inline-block" />
            <span className="text-gray-400">Périodes / Mouvements</span>
          </div>
        </div>
      </div>

      {/* Conseils d'utilisation */}
      <div className="metal-card p-5">
        <h3 className="font-serif text-lg mb-3">💡 Navigation</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• <strong>Zoom</strong> : Molette de la souris pour zoomer/dézoomer</li>
          <li>• <strong>Déplacement</strong> : Glisser pour naviguer dans le temps</li>
          <li>• <strong>Survol</strong> : Passez sur un événement pour plus de détails</li>
          <li>• <strong>Périodes</strong> : Les barres horizontales représentent des mouvements</li>
        </ul>
      </div>
    </div>
  );
}
