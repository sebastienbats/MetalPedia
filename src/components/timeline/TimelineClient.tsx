'use client';

import { useEffect, useRef, useState } from 'react';
import Loader from '@/components/ui/Loader';
import { PILLAR_METADATA, type GamificationPillar, type TimelineEvent } from '@/types/api';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { DECADES_METADATA } from '@/data/decades';
import { 
  countEventsInDecade, 
  getActivePillarsInDecade 
} from '@/utils/timelineStats';

// ═══════════════════════════════════════════
// ÉVÉNEMENTS METAL (groupe 'events' - orientation bottom)
// ═══════════════════════════════════════════
const METAL_EVENTS: TimelineEvent[] = [
  { id: 1, group: 'events', content: 'Formation de Black Sabbath', start: '1968-11-01', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Le Premier Riff résonne. Le Silence Primordial est brisé.' },
  { id: 2, group: 'events', content: 'Sortie de "Paranoid"', start: '1970-09-18', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Les Tables du Savoir enregistrent leur premier chapitre.' },
  { id: 3, group: 'events', content: 'Deep Purple - "Machine Head"', start: '1972-03-25', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Le riff devient une incantation.' },
  { id: 4, group: 'events', content: 'Led Zeppelin - "Houses of the Holy"', start: '1973-03-28', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Les sanctuaires du rock s\'élèvent.' },
  { id: 5, group: 'events', content: 'Iron Maiden - Formation', start: '1975-12-25', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'La Vierge de Fer naît dans les brumes de Londres.' },
  { id: 6, group: 'events', content: 'Judas Priest - "British Steel"', start: '1980-04-14', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'L\'acier britannique forge une nouvelle ère.' },
  { id: 7, group: 'events', content: 'NWOBHM - Nouvelle vague du heavy', start: '1979-01-01', end: '1983-12-31', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'La forge s\'embrase en Grande-Bretagne.' },
  { id: 8, group: 'events', content: 'Metallica - Formation', start: '1981-10-28', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'Les quatre cavaliers de l\'apocalypse thrash se rassemblent.' },
  { id: 9, group: 'events', content: 'Metallica - "Kill \'Em All"', start: '1983-07-25', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'La vitesse devient une arme. +25 XP Vitesse acquise.' },
  { id: 10, group: 'events', content: 'Slayer - "Reign in Blood"', start: '1986-10-07', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'La violence sonore atteint son paroxysme.' },
  { id: 11, group: 'events', content: 'Megadeth - "Peace Sells"', start: '1986-09-19', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'La paix se vend, la guerre s\'achète.' },
  { id: 12, group: 'events', content: 'Anthrax - "Among the Living"', start: '1987-03-22', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'Le Big Four est complet. Le thrash règne.' },
  { id: 13, group: 'events', content: 'Émergence du Death Metal (Floride)', start: '1983-01-01', end: '1990-12-31', type: 'range', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Les profondeurs de la Floride engendrent l\'horreur sonore.' },
  { id: 14, group: 'events', content: 'Death - "Scream Bloody Gore"', start: '1987-05-28', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Le growl est forgé. Le Nécromancien approuve.' },
  { id: 15, group: 'events', content: 'Morbid Angel - "Altars of Madness"', start: '1989-05-12', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Les autels de la folie sont érigés.' },
  { id: 16, group: 'events', content: 'Cannibal Corpse - Formation', start: '1988-12-01', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Le cadavre cannibale prend vie à Buffalo.' },
  { id: 17, group: 'events', content: 'Première vague Black Metal', start: '1982-01-01', end: '1990-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'Les ténèbres s\'éveillent en Europe.' },
  { id: 18, group: 'events', content: 'Seconde vague Black Metal norvégien', start: '1991-01-01', end: '1996-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black', loreSnippet: ' Les forêts de Norvège s\'embrasent. Le froid est absolu.' },
  { id: 19, group: 'events', content: 'Darkthrone - "A Blaze in the Northern Sky"', start: '1992-02-26', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'Un brasier s\'allume dans le ciel du Nord.' },
  { id: 20, group: 'events', content: 'Mayhem - "De Mysteriis Dom Sathanas"', start: '1994-05-24', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'L\'opus maudit scelle le pacte avec l\'Oubli.' },
  { id: 21, group: 'events', content: 'Burzum - "Filosofem"', start: '1996-01-01', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'La philosophie du son devient incantation.' },
  { id: 22, group: 'events', content: 'Helloween - "Keeper of the Seven Keys"', start: '1987-05-23', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'Les mélodies épiques ouvrent les portails du fantastique.' },
  { id: 23, group: 'events', content: 'Blind Guardian - "Somewhere Far Beyond"', start: '1992-03-30', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'Quelque part au-delà, les bardes chantent encore.' },
  { id: 24, group: 'events', content: 'Explosion du Power Metal européen', start: '1994-01-01', end: '2000-12-31', type: 'range', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'L\'Europe s\'illumine de mélodies héroïques.' },
  { id: 25, group: 'events', content: 'Nightwish - Formation', start: '1996-07-06', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'Le symphonique s\'allie à la puissance du métal.' },
  { id: 26, group: 'events', content: 'Korn - Premier album', start: '1994-10-11', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Les chaînes du conventionnel sont brisées. Le Nu Metal déferle.' },
  { id: 27, group: 'events', content: 'Nu Metal - Ère mainstream', start: '1994-01-01', end: '2004-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Le metal conquiert les ondes et les MTV.' },
  { id: 28, group: 'events', content: 'System of a Down - "Toxicity"', start: '2001-09-04', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'La toxicité devient un art politique.' },
  { id: 29, group: 'events', content: 'Metalcore - Émergence', start: '2000-01-01', end: '2010-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Le cœur du metal bat au rythme des breakdowns.' },
  { id: 30, group: 'events', content: 'Killswitch Engage - "Alive or Just Breathing"', start: '2002-05-21', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Vivant ou seulement respirant, le metalcore persiste.' },
  { id: 31, group: 'events', content: 'Meshuggah - "Catch Thirtythree"', start: '2005-05-23', pillar: 'Progressive Metal', className: 'tp-progressive', loreSnippet: 'L\'Architecte du Chaos redéfinit les mathématiques du riff.' },
  { id: 32, group: 'events', content: 'Periphery - Formation', start: '2005-01-01', pillar: 'Progressive Metal', className: 'tp-progressive', loreSnippet: 'La périphérie du metal repousse ses limites.' },
  { id: 33, group: 'events', content: 'Djent & Metal progressif moderne', start: '2005-01-01', end: '2015-12-31', type: 'range', pillar: 'Progressive Metal', className: 'tp-progressive', loreSnippet: 'Le djent résonne. Les temps impairs deviennent rois.' },
  { id: 34, group: 'events', content: 'Renaissance du Heavy Trad', start: '2015-01-01', end: '2026-01-01', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Les anciens reviennent. La boucle est bouclée.' },
  { id: 35, group: 'events', content: 'Ghost - "Meliora"', start: '2015-08-21', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Le clergé satirique bénit les foules.' },
];

// ══════════════════════════════════════════
// SCEAUX DE CIRE (groupe 'wax-seals' - orientation top)
// Placés au MILIEU de chaque décennie (1975, 1985, etc.)
// Content = '1970', '1980'... pour que DECADES_METADATA[event.content] fonctionne
// ══════════════════════════════════════════
const WAX_SEALS: TimelineEvent[] = [
  { id: 1001, group: 'wax-seals', content: '1970', start: '1975-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 1970' },
  { id: 1002, group: 'wax-seals', content: '1980', start: '1985-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 1980' },
  { id: 1003, group: 'wax-seals', content: '1990', start: '1995-01-01', className: 'tp-wax-seal', loreSnippet: ' Sceau de la décennie 1990' },
  { id: 1004, group: 'wax-seals', content: '2000', start: '2005-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 2000' },
  { id: 1005, group: 'wax-seals', content: '2010', start: '2015-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 2010' },
  { id: 1006, group: 'wax-seals', content: '2020', start: '2025-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 2020' },
];

const ALL_TIMELINE_ITEMS = [...METAL_EVENTS, ...WAX_SEALS];

export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLore, setActiveLore] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<GamificationPillar[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const initTimeline = async () => {
      try {
        if (timelineRef.current) return;
        const { Timeline, DataSet } = await import('vis-timeline/standalone');
        const initialItems = new DataSet(ALL_TIMELINE_ITEMS);
        
        // ══════════════════════════════════════════
        // GROUPES : Séparation structurelle des panneaux
        // - events : orientation 'bottom' (en dessous de l'axe)
        // - wax-seals : orientation 'top' (au-dessus de l'axe, avec les dates)
        // ══════════════════════════════════════════
        const groups = new DataSet([
          { 
            id: 'events', 
            content: ' ', // Espace pour éviter les bugs de rendu
          },
          { 
            id: 'wax-seals', 
            content: ' ', 
            orientation: 'top',
          },
        ]);
        
        const isMobile = window.innerWidth < 768;
        const isSmall = window.innerWidth < 480;

        const options: any = {
          groups: groups,
          height: isSmall ? '400px' : isMobile ? '450px' : '600px',
          start: isMobile ? '1985-01-01' : '1975-01-01',
          end: isMobile ? '2000-01-01' : '2010-01-01',
          min: '1965-01-01',
          max: '2030-12-31',
          zoomMin: 1000 * 60 * 60 * 24 * 365,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 40,
          margin: { item: isMobile ? 15 : 30, axis: isMobile ? 8 : 15 },
          orientation: 'top',
          stack: true,
          showCurrentTime: false,
          moveable: true,
          zoomable: true,
          // ✅ NOUVEAU : Affiche les dates tous les 5 ans (1970, 1975, 1980, 1985...)
          // Les wax seals (1975, 1985, 1995...) s'alignent automatiquement dessus
          timeAxis: {
            scale: 'year',
            step: 5,
          },
          template: (item: TimelineEvent) => {
            if (item.className === 'tp-wax-seal') {
              return `<div class="wax-seal-icon">${item.content}</div>`;
            }
            const pillarData = item.pillar ? PILLAR_METADATA[item.pillar] : null;
            const icon = pillarData?.icon || '🎸';
            const color = pillarData?.color || '#8b0000';
            return `<div class="parchment-icon" style="--pillar-color: ${color};">${icon}</div>`;
          },
        };

        timelineRef.current = new Timeline(container, initialItems, options);

        // ══════════════════════════════════════════
        // GESTION DES CLICS avec LORE AVANCÉ
        // ══════════════════════════════════════════
        timelineRef.current.on('click', (properties: any) => {
          if (properties.item) {
            const event = ALL_TIMELINE_ITEMS.find(e => e.id === properties.item);
            if (event) {
              // ✅ LORE AVANCÉ pour les sceaux de cire
              if (event.className === 'tp-wax-seal') {
                const decade = event.content; // '1970', '1980', etc.
                const metadata = DECADES_METADATA[decade];
                
                if (!metadata) {
                  setActiveLore(`🔴 Sceau de la décennie ${decade}`);
                  return;
                }
                
                const decadeStart = metadata.period.start;
                const decadeEnd = metadata.period.end;
                const eventCount = countEventsInDecade(METAL_EVENTS, decadeStart, decadeEnd);
                const activePillars = getActivePillarsInDecade(METAL_EVENTS, decadeStart, decadeEnd);
                
                // ✅ Format original : piliers sur une seule ligne séparés par virgules
                const pillarsDisplay = activePillars
                  .map(pillar => {
                    const pillarData = PILLAR_METADATA[pillar as GamificationPillar];
                    return pillarData ? `${pillarData.icon} ${pillar}` : pillar;
                  })
                  .join(', ');
                
                // ✅ Chaque section séparée par \n\n pour le parseur React
                const richLore = `🔴 ${metadata.epicTitle}

📅 Période : ${decadeStart} - ${decadeEnd}

 ${metadata.narrative}

✨ Statistiques de la décennie :

• ${eventCount} événements majeurs
• Piliers actifs : ${pillarsDisplay}

🏆 Événement marquant : ${metadata.keyEvent || 'N/A'}`;

                setActiveLore(richLore);
                return;
              }

              // ✅ LORE standard pour les événements normaux
              let tooltipContent = event.content;
              const startYear = new Date(event.start).getFullYear();
              
              if (event.type === 'range' && event.end) {
                const endYear = new Date(event.end).getFullYear();
                tooltipContent += `\n📅 Période : ${startYear} - ${endYear}`;
              } else {
                const dateObj = new Date(event.start);
                const options: Intl.DateTimeFormatOptions = { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                };
                const formattedDate = dateObj.toLocaleDateString('fr-FR', options);
                tooltipContent += `\n Date : ${formattedDate}`;
              }
              
              if (event.loreSnippet) {
                tooltipContent += `\n\n📜 ${event.loreSnippet}`;
              }
              
              setActiveLore(tooltipContent);
            }
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

  useEffect(() => {
    if (!timelineRef.current) return;
    import('vis-timeline/standalone').then(({ DataSet }) => {
      const filteredEvents = activeFilters.length > 0
        ? METAL_EVENTS.filter(e => activeFilters.includes(e.pillar!))
        : METAL_EVENTS;
      const itemsToShow = [...filteredEvents, ...WAX_SEALS];
      timelineRef.current.setItems(new DataSet(itemsToShow));
      setActiveLore(null);
    });
  }, [activeFilters]);

  const handleGoToYear = (year: string) => {
    if (timelineRef.current) {
      timelineRef.current.moveTo(`${year}-01-01`, { animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
      setActiveLore(null);
    }
  };

  const toggleFilter = (pillar: GamificationPillar) => {
    setActiveFilters(prev =>
      prev.includes(pillar) ? prev.filter(p => p !== pillar) : [...prev, pillar]
    );
  };

  const filteredCount = activeFilters.length > 0
    ? METAL_EVENTS.filter(e => activeFilters.includes(e.pillar!)).length
    : METAL_EVENTS.length;

  if (!mounted) return <Loader text="Invocation de la chronologie..." />;

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="metal-card p-4 space-y-4">
        <div>
          <h3 className="font-serif text-sm mb-3 text-gray-400 uppercase tracking-wider">🔍 Filtrer par pilier</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            <button
              onClick={() => setActiveFilters([])}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 snap-start ${
                activeFilters.length === 0
                  ? 'bg-metal-fire text-white border-metal-fire shadow-lg shadow-metal-fire/50 scale-105'
                  : 'bg-metal-fire/20 text-white border-metal-fire/40 hover:bg-metal-fire/40'
              }`}
            >
              🌍 Tout
            </button>
            {Object.entries(PILLAR_METADATA).map(([key, data]) => {
              const isActive = activeFilters.includes(key as GamificationPillar);
              return (
                <button
                  key={key}
                  onClick={() => toggleFilter(key as GamificationPillar)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 text-white hover:scale-105 snap-start"
                  style={{
                    backgroundColor: isActive ? `${data.color}d9` : `${data.color}4d`,
                    borderColor: isActive ? data.color : `${data.color}80`,
                    boxShadow: isActive ? `0 0 12px ${data.color}90, 0 0 24px ${data.color}50` : '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  <span>{data.icon}</span>
                  <span className="hidden sm:inline">{key === 'Progressive Metal' ? 'Prog' : key.replace(' Metal', '')}</span>
                </button>
              );
            })}
          </div>
          {activeFilters.length > 0 && (
            <p className="text-xs text-gray-500 mt-2 italic">✨ {filteredCount} événement{filteredCount > 1 ? 's' : ''}</p>
          )}
        </div>

        {/* ✅ PARSEUR DE LORE AVANCÉ (Gestion complète des emojis et sections) */}
        {activeLore && (
          <div className="border-l-4 border-metal-fire bg-metal-fire/5 p-4 animate-fade-in rounded-r-lg">
            <div className="text-gray-200 font-serif space-y-3">
              {activeLore.split('\n\n').map((section, sectionIndex) => {
                // Titre principal (première section)
                if (sectionIndex === 0 && section.startsWith('🔴')) {
                  return (
                    <h3 key={sectionIndex} className="text-xl font-bold text-metal-fire mb-4">
                      {section.trim()}
                    </h3>
                  );
                }
                // Période
                if (section.startsWith('📅')) {
                  return (
                    <p key={sectionIndex} className="text-sm font-semibold text-metal-rust">
                      {section}
                    </p>
                  );
                }
                // Lore narratif
                if (section.startsWith('📜')) {
                  return (
                    <p key={sectionIndex} className="text-sm leading-relaxed text-gray-300 italic">
                      {section.replace('📜 ', '')}
                    </p>
                  );
                }
                // Statistiques header
                if (section.startsWith('✨')) {
                  return (
                    <div key={sectionIndex} className="mt-4 pt-3 border-t border-metal-fire/30">
                      <p className="text-sm font-semibold text-metal-fire mb-2">{section}</p>
                    </div>
                  );
                }
                // Détails des stats (lignes commençant par •)
                if (section.includes('•')) {
                  const lines = section.split('\n').filter(line => line.trim());
                  return (
                    <ul key={sectionIndex} className="space-y-1">
                      {lines.map((line, lineIndex) => (
                        <li key={lineIndex} className="text-sm text-gray-400 pl-2">
                          {line.replace('• ', '')}
                        </li>
                      ))}
                    </ul>
                  );
                }
                // Événement marquant
                if (section.startsWith('🏆')) {
                  return (
                    <div key={sectionIndex} className="mt-3 p-3 bg-metal-fire/10 rounded-lg border border-metal-fire/30">
                      <p className="text-sm font-semibold text-metal-fire mb-1">{section.split(':')[0]}</p>
                      <p className="text-sm text-gray-300">{section.split(':')[1]?.trim()}</p>
                    </div>
                  );
                }
                // Fallback
                return (
                  <p key={sectionIndex} className="text-sm text-gray-300">
                    {section}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-metal-black/80 z-10 rounded-lg">
              <Loader text="Tissage de la chronologie..." />
            </div>
          )}
          <div ref={containerRef} className="rounded-lg overflow-hidden timeline-container" style={{ minHeight: '400px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="metal-card p-4 sm:p-5">
          <h3 className="font-serif text-base sm:text-lg mb-3 text-metal-rust">⏳ Navigation Rapide</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {['1970', '1985', '2000', '2015'].map((year) => (
              <button key={year} onClick={() => handleGoToYear(year)} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-metal-gray bg-metal-black/50 text-gray-300 hover:text-metal-fire hover:border-metal-fire hover:bg-metal-fire/10 transition-all active:scale-95">
                {year}
              </button>
            ))}
            <button onClick={() => handleGoToYear('1975')} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-metal-gray bg-metal-black/50 text-gray-300 hover:text-white hover:border-white transition-all active:scale-95">
              ↺
            </button>
          </div>
        </div>
        <div className="metal-card p-4 sm:p-5">
          <h3 className="font-serif text-base sm:text-lg mb-3 text-metal-rust">🎨 Légende des Piliers</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(PILLAR_METADATA).map(([key, data]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm inline-block shadow-sm" style={{ backgroundColor: data.color }} />
                <span className="text-gray-400">{data.icon} {key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="metal-card p-4 sm:p-5">
        <h3 className="font-serif text-base sm:text-lg mb-3 text-metal-rust">💡 Navigation</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex items-start gap-2"><span className="text-metal-fire mt-0.5">•</span><span><strong>Clic :</strong> Cliquez sur une icône pour révéler le contenu complet et le lore de l'événement.</span></li>
          <li className="flex items-start gap-2"><span className="text-metal-fire mt-0.5">•</span><span><strong>Filtres :</strong> Cliquez sur un ou plusieurs piliers pour isoler leur histoire.</span></li>
          <li className="flex items-start gap-2"><span className="text-metal-fire mt-0.5">•</span><span><strong>Desktop :</strong> Molette pour zoomer, glisser pour naviguer.</span></li>
          <li className="flex items-start gap-2"><span className="text-metal-fire mt-0.5">•</span><span><strong>Mobile :</strong> Glissez horizontalement. Pincez pour zoomer. Utilisez les boutons d'années pour voyager rapidement.</span></li>
        </ul>
      </div>
    </div>
  );
}
