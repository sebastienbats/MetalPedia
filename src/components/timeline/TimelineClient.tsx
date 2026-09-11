'use client';

import { useEffect, useRef, useState } from 'react';
import Loader from '@/components/ui/Loader';
import { PILLAR_METADATA, type GamificationPillar } from '@/types/api';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

interface TimelineEvent {
  id: number;
  content: string;
  start: string;
  end?: string;
  type?: 'point' | 'range';
  pillar?: GamificationPillar;
  className?: string;
  loreSnippet?: string;
}

const METAL_EVENTS: TimelineEvent[] = [
  { id: 1, content: 'Formation de Black Sabbath', start: '1968-11-01', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Le Premier Riff résonne. Le Silence Primordial est brisé.' },
  { id: 2, content: 'Sortie de "Paranoid"', start: '1970-09-18', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Les Tables du Savoir enregistrent leur premier chapitre.' },
  { id: 3, content: 'Deep Purple - "Machine Head"', start: '1972-03-25', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Le riff devient une incantation.' },
  { id: 4, content: 'Led Zeppelin - "Houses of the Holy"', start: '1973-03-28', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Les sanctuaires du rock s\'élèvent.' },
  { id: 5, content: 'Iron Maiden - Formation', start: '1975-12-25', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'La Vierge de Fer naît dans les brumes de Londres.' },
  { id: 6, content: 'Judas Priest - "British Steel"', start: '1980-04-14', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'L\'acier britannique forge une nouvelle ère.' },
  { id: 7, content: 'NWOBHM - Nouvelle vague du heavy', start: '1979-01-01', end: '1983-12-31', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'La forge s\'embrase en Grande-Bretagne.' },
  { id: 8, content: 'Metallica - Formation', start: '1981-10-28', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'Les quatre cavaliers de l\'apocalypse thrash se rassemblent.' },
  { id: 9, content: 'Metallica - "Kill \'Em All"', start: '1983-07-25', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'La vitesse devient une arme. +25 XP Vitesse acquise.' },
  { id: 10, content: 'Slayer - "Reign in Blood"', start: '1986-10-07', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'La violence sonore atteint son paroxysme.' },
  { id: 11, content: 'Megadeth - "Peace Sells"', start: '1986-09-19', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'La paix se vend, la guerre s\'achète.' },
  { id: 12, content: 'Anthrax - "Among the Living"', start: '1987-03-22', pillar: 'Thrash Metal', className: 'tp-thrash', loreSnippet: 'Le Big Four est complet. Le thrash règne.' },
  { id: 13, content: 'Émergence du Death Metal (Floride)', start: '1983-01-01', end: '1990-12-31', type: 'range', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Les profondeurs de la Floride engendrent l\'horreur sonore.' },
  { id: 14, content: 'Death - "Scream Bloody Gore"', start: '1987-05-28', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Le growl est forgé. Le Nécromancien approuve.' },
  { id: 15, content: 'Morbid Angel - "Altars of Madness"', start: '1989-05-12', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Les autels de la folie sont érigés.' },
  { id: 16, content: 'Cannibal Corpse - Formation', start: '1988-12-01', pillar: 'Death Metal', className: 'tp-death', loreSnippet: 'Le cadavre cannibale prend vie à Buffalo.' },
  { id: 17, content: 'Première vague Black Metal', start: '1982-01-01', end: '1990-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'Les ténèbres s\'éveillent en Europe.' },
  { id: 18, content: 'Seconde vague Black Metal norvégien', start: '1991-01-01', end: '1996-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black', loreSnippet: '🌑 Les forêts de Norvège s\'embrasent. Le froid est absolu.' },
  { id: 19, content: 'Darkthrone - "A Blaze in the Northern Sky"', start: '1992-02-26', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'Un brasier s\'allume dans le ciel du Nord.' },
  { id: 20, content: 'Mayhem - "De Mysteriis Dom Sathanas"', start: '1994-05-24', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'L\'opus maudit scelle le pacte avec l\'Oubli.' },
  { id: 21, content: 'Burzum - "Filosofem"', start: '1996-01-01', pillar: 'Black Metal', className: 'tp-black', loreSnippet: 'La philosophie du son devient incantation.' },
  { id: 22, content: 'Helloween - "Keeper of the Seven Keys"', start: '1987-05-23', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'Les mélodies épiques ouvrent les portails du fantastique.' },
  { id: 23, content: 'Blind Guardian - "Somewhere Far Beyond"', start: '1992-03-30', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'Quelque part au-delà, les bardes chantent encore.' },
  { id: 24, content: 'Explosion du Power Metal européen', start: '1994-01-01', end: '2000-12-31', type: 'range', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'L\'Europe s\'illumine de mélodies héroïques.' },
  { id: 25, content: 'Nightwish - Formation', start: '1996-07-06', pillar: 'Power Metal', className: 'tp-power', loreSnippet: 'Le symphonique s\'allie à la puissance du métal.' },
  { id: 26, content: 'Korn - Premier album', start: '1994-10-11', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Les chaînes du conventionnel sont brisées. Le Nu Metal déferle.' },
  { id: 27, content: 'Nu Metal - Ère mainstream', start: '1994-01-01', end: '2004-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Le metal conquiert les ondes et les MTV.' },
  { id: 28, content: 'System of a Down - "Toxicity"', start: '2001-09-04', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'La toxicité devient un art politique.' },
  { id: 29, content: 'Metalcore - Émergence', start: '2000-01-01', end: '2010-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Le cœur du metal bat au rythme des breakdowns.' },
  { id: 30, content: 'Killswitch Engage - "Alive or Just Breathing"', start: '2002-05-21', pillar: 'Metalcore', className: 'tp-metalcore', loreSnippet: 'Vivant ou seulement respirant, le metalcore persiste.' },
  { id: 31, content: 'Meshuggah - "Catch Thirtythree"', start: '2005-05-23', pillar: 'Progressive Metal', className: 'tp-progressive', loreSnippet: 'L\'Architecte du Chaos redéfinit les mathématiques du riff.' },
  { id: 32, content: 'Periphery - Formation', start: '2005-01-01', pillar: 'Progressive Metal', className: 'tp-progressive', loreSnippet: 'La périphérie du metal repousse ses limites.' },
  { id: 33, content: 'Djent & Metal progressif moderne', start: '2005-01-01', end: '2015-12-31', type: 'range', pillar: 'Progressive Metal', className: 'tp-progressive', loreSnippet: 'Le djent résonne. Les temps impairs deviennent rois.' },
  { id: 34, content: 'Renaissance du Heavy Trad', start: '2015-01-01', end: '2026-01-01', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Les anciens reviennent. La boucle est bouclée.' },
  { id: 35, content: 'Ghost - "Meliora"', start: '2015-08-21', pillar: 'Heavy Metal', className: 'tp-heavy', loreSnippet: 'Le clergé satirique bénit les foules.' },
];

// 🕯️ SCEAUX DE CIRE ajoutés comme items normaux
const WAX_SEALS: TimelineEvent[] = [
  { id: 1001, content: '1970', start: '1970-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 1970' },
  { id: 1002, content: '1980', start: '1980-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 1980' },
  { id: 1003, content: '1990', start: '1990-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 1990' },
  { id: 1004, content: '2000', start: '2000-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 2000' },
  { id: 1005, content: '2010', start: '2010-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 2010' },
  { id: 1006, content: '2020', start: '2020-01-01', className: 'tp-wax-seal', loreSnippet: '🔴 Sceau de la décennie 2020' },
];

// Fusion des événements et des sceaux
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
        const { Timeline, DataSet } = await import('vis-timeline/standalone');
        
        // ✅ Utilisation du tableau fusionné (événements + sceaux)
        const initialItems = new DataSet(ALL_TIMELINE_ITEMS);
        
        const isMobile = window.innerWidth < 768;
        const isSmall = window.innerWidth < 480;

        const options: any = {
          // ✅ Hauteur adaptative
          height: isSmall ? '400px' : isMobile ? '450px' : '600px',
          
          // ✅ Vue initiale : 15 ans sur mobile, 35 ans sur desktop
          start: isMobile ? '1985-01-01' : '1975-01-01',
          end: isMobile ? '2000-01-01' : '2010-01-01',
          
          // ✅ Limites de navigation : toute la chronologie (1965-2030)
          min: '1965-01-01',
          max: '2030-12-31',
          
          // ✅ Zoom : de 1 an à 40 ans
          zoomMin: 1000 * 60 * 60 * 24 * 365,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 40,
          
          // ✅ Marges réduites sur mobile pour mieux utiliser l'espace
          margin: { 
            item: isMobile ? 15 : 30, 
            axis: isMobile ? 8 : 15 
          },
          
          orientation: {
            axis: 'top',
            item: 'top'
          },
          stack: true,
          showCurrentTime: false,
          
          // ✅ GLISSER et ZOOMER activés sur TOUS les écrans
          moveable: true,
          zoomable: true,
          
          template: (item: TimelineEvent) => {
            // ✅ Gestion de l'affichage des sceaux
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

        timelineRef.current.on('click', (properties: any) => {
          if (properties.item) {
            const event = ALL_TIMELINE_ITEMS.find(e => e.id === properties.item);
            if (event) {
              // ✅ Gestion du clic sur les sceaux
              if (event.className === 'tp-wax-seal') {
                setActiveLore(`🔴 Sceau de la décennie ${event.content}`);
                return;
              }
              let tooltipContent = event.content;
              if (event.type === 'range' && event.end) {
                const startYear = new Date(event.start).getFullYear();
                const endYear = new Date(event.end).getFullYear();
                tooltipContent = `${event.content} (${startYear} - ${endYear})`;
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
      
      // ✅ Important : toujours inclure les sceaux même lors du filtrage
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
          {/* ✅ scroll-hide et snap-x pour un défilement tactile fluide */}
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

        {activeLore && (
          <div className="border-l-4 border-metal-fire bg-metal-fire/5 p-3 animate-fade-in rounded-r-lg">
            <div className="text-gray-200 font-serif whitespace-pre-line">
              {activeLore.split('\n\n').map((part, index) => (
                <p key={index} className={index === 0 ? 'text-lg font-bold mb-2' : 'text-sm italic text-gray-300'}>{part}</p>
              ))}
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
        {/* ✅ Padding adaptatif (p-4 sur mobile, p-5 sur desktop) */}
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
