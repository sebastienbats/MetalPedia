'use client';

import { useEffect, useRef, useState } from 'react';
import Loader from '@/components/ui/Loader';
import { PILLAR_METADATA, type GamificationPillar } from '@/types/api';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface TimelineEvent {
  id: number;
  content: string;
  start: string;
  end?: string;
  type?: 'point' | 'range';
  pillar?: GamificationPillar;
  loreSnippet?: string;
}

// ═══════════════════════════════════════════════════════════
// DONNÉES HISTORIQUES (Enrichies avec Piliers & Lore)
// ═══════════════════════════════════════════════════════════

const METAL_EVENTS: TimelineEvent[] = [
  { id: 1, content: 'Formation de Black Sabbath', start: '1968-11-01', pillar: 'Heavy Metal', loreSnippet: 'Le Premier Riff résonne. Le Silence Primordial est brisé.' },
  { id: 2, content: 'Sortie de "Paranoid"', start: '1970-09-18', pillar: 'Heavy Metal', loreSnippet: 'Les Tables du Savoir enregistrent leur premier chapitre.' },
  { id: 3, content: 'NWOBHM - Nouvelle vague du heavy', start: '1979-01-01', end: '1983-12-31', type: 'range', pillar: 'Heavy Metal', loreSnippet: 'La forge s\'embrase en Grande-Bretagne.' },
  
  { id: 4, content: 'Metallica - Formation', start: '1981-10-28', pillar: 'Thrash Metal', loreSnippet: 'Les quatre cavaliers de l\'apocalypse thrash se rassemblent.' },
  { id: 5, content: 'Metallica - "Kill \'Em All"', start: '1983-07-25', pillar: 'Thrash Metal', loreSnippet: 'La vitesse devient une arme. +25 XP Vitesse acquise.' },
  { id: 6, content: 'Slayer - "Reign in Blood"', start: '1986-10-07', pillar: 'Thrash Metal', loreSnippet: 'La violence sonore atteint son paroxysme.' },

  { id: 7, content: 'Émergence du Death Metal (Floride)', start: '1983-01-01', end: '1990-12-31', type: 'range', pillar: 'Death Metal', loreSnippet: 'Les profondeurs de la Floride engendrent l\'horreur sonore.' },
  { id: 8, content: 'Death - "Scream Bloody Gore"', start: '1987-05-28', pillar: 'Death Metal', loreSnippet: 'Le growl est forgé. Le Necromancien approuve.' },

  { id: 9, content: 'Première vague Black Metal', start: '1982-01-01', end: '1990-12-31', type: 'range', pillar: 'Black Metal', loreSnippet: 'Les ténèbres s\'éveillent en Europe.' },
  { id: 10, content: 'Seconde vague Black Metal norvégien', start: '1991-01-01', end: '1996-12-31', type: 'range', pillar: 'Black Metal', loreSnippet: '🌑 Les forêts de Norvège s\'embrasent. Le froid est absolu.' },
  { id: 11, content: 'Mayhem - "De Mysteriis Dom Sathanas"', start: '1994-05-24', pillar: 'Black Metal', loreSnippet: 'L\'opus maudit scelle le pacte avec l\'Oubli.' },

  { id: 12, content: 'Helloween - "Keeper of the Seven Keys"', start: '1987-05-23', pillar: 'Power Metal', loreSnippet: 'Les mélodies épiques ouvrent les portails du fantastique.' },
  { id: 13, content: 'Nightwish - Formation', start: '1996-07-06', pillar: 'Power Metal', loreSnippet: 'Le symphonique s\'allie à la puissance du métal.' },

  { id: 14, content: 'Korn - Premier album', start: '1994-10-11', pillar: 'Metalcore', loreSnippet: 'Les chaînes du conventionnel sont brisées. Le Nu Metal déferle.' },
  { id: 15, content: 'Killswitch Engage - "Alive or Just Breathing"', start: '2002-05-21', pillar: 'Metalcore', loreSnippet: 'Le cœur du Metalcore bat à travers les breakdowns.' },

  { id: 16, content: 'Meshuggah - "Catch Thirtythree"', start: '2005-05-23', pillar: 'Progressive Metal', loreSnippet: 'L\'Architecte du Chaos redéfinit les mathématiques du riff.' },
  { id: 17, content: 'Renaissance du Heavy Trad', start: '2015-01-01', end: '2026-01-01', type: 'range', pillar: 'Heavy Metal', loreSnippet: 'Les anciens reviennent. La boucle est bouclée.' },
];

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null); // 🆕 Ref pour stocker l'instance de la timeline
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLore, setActiveLore] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;

    const initTimeline = async () => {
      try {
        const { Timeline, DataSet } = await import('vis-timeline/standalone');
        const items = new DataSet(METAL_EVENTS);

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        const options = {
          height: isMobile ? '400px' : '500px',
          start: '1975-01-01',
          end: '2010-01-01',
          min: '1965-01-01',
          max: '2030-12-31',
          zoomMin: 1000 * 60 * 60 * 24 * 365,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 40,
          margin: { item: 10, axis: 5 },
          orientation: 'top',
          stack: true,
          showCurrentTime: false,
          zoomable: !isMobile,
          moveable: true,
          template: (item: TimelineEvent) => {
            const pillarData = item.pillar ? PILLAR_METADATA[item.pillar] : null;
            const color = pillarData?.color || '#c9a227';
            const icon = pillarData?.icon || '🎸';
            
            return `
              <div class="timeline-custom-item" style="border-left: 3px solid ${color}; background: ${color}15;">
                <span class="timeline-icon">${icon}</span>
                <span class="timeline-content">${item.content}</span>
              </div>
            `;
          },
        };

        // 🆕 Stocker l'instance dans la ref
        timelineRef.current = new Timeline(container, items, options);

        timelineRef.current.on('select', (properties: any) => {
          if (properties.items.length > 0) {
            const itemId = properties.items[0];
            const event = METAL_EVENTS.find(e => e.id === itemId);
            if (event?.loreSnippet) {
              setActiveLore(event.loreSnippet);
            }
          } else {
            setActiveLore(null);
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur initialisation timeline:', error);
        setIsLoading(false);
      }
    };

    initTimeline();

    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [mounted]);

  // 🆕 Fonction de navigation rapide
  const handleGoToYear = (year: string) => {
    if (timelineRef.current) {
      // Déplace la timeline au 1er janvier de l'année choisie avec une animation fluide
      timelineRef.current.moveTo(`${year}-01-01`, { animation: true });
      setActiveLore(null); // Réinitialise le lore quand on change d'époque
    }
  };

  if (!mounted) return <Loader text="Invocation de la chronologie..." />;

  return (
    <div className="space-y-6">
      {/* PANNEAU DE LORE ACTIF */}
      {activeLore && (
        <div className="metal-card p-4 border-l-4 border-metal-fire bg-metal-fire/5 animate-fade-in">
          <p className="text-gray-200 font-serif italic text-center">
            📜 <span className="text-metal-fire font-bold">Écho du Lore :</span> {activeLore}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="metal-card p-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-metal-black/80 z-10 rounded-lg">
            <Loader text="Tissage de la chronologie..." />
          </div>
        )}
        <div ref={containerRef} className="rounded-lg overflow-hidden" style={{ minHeight: '400px' }} />
      </div>

      {/* 🆕 CONTRÔLES DE NAVIGATION RAPIDE */}
      <div className="flex flex-wrap justify-center gap-2">
        {['1970', '1985', '2000', '2015'].map((year) => (
          <button
            key={year}
            onClick={() => handleGoToYear(year)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-metal-gray bg-metal-black/50 text-gray-300 hover:text-metal-fire hover:border-metal-fire hover:bg-metal-fire/10 transition-all active:scale-95"
          >
            ⏳ Aller à {year}
          </button>
        ))}
        <button
          onClick={() => handleGoToYear('1975')} // Reset par défaut
          className="px-4 py-2 text-sm font-medium rounded-lg border border-metal-gray bg-metal-black/50 text-gray-300 hover:text-white hover:border-white transition-all active:scale-95"
        >
          ↺ Reset
        </button>
      </div>

      {/* Légende dynamique */}
      <div className="metal-card p-5">
        <h3 className="font-serif text-lg mb-3 text-metal-rust">🎨 Légende des Piliers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {Object.entries(PILLAR_METADATA).map(([key, data]) => (
            <div key={key} className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-sm inline-block shadow-sm" 
                style={{ backgroundColor: data.color }} 
              />
              <span className="text-gray-400">{data.icon} {key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conseils d'utilisation */}
      <div className="metal-card p-5">
        <h3 className="font-serif text-lg mb-3 text-metal-rust">💡 Navigation</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-metal-fire mt-0.5">•</span>
            <span><strong>Desktop :</strong> Molette pour zoomer, glisser pour naviguer.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-metal-fire mt-0.5">•</span>
            <span><strong>Mobile :</strong> Glissez (swipe) horizontalement. Utilisez les boutons ci-dessus pour sauter rapidement dans le temps.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-metal-fire mt-0.5">•</span>
            <span><strong>Lore :</strong> Cliquez sur un événement pour révéler un fragment de l'histoire du Metalverse.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
