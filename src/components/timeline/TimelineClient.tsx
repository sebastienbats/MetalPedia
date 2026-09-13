'use client';

import { useEffect, useRef, useState } from 'react';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

const METAL_EVENTS = [
  { id: 1, content: 'Formation de Black Sabbath', start: '1968-11-01', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 2, content: 'Sortie de "Paranoid"', start: '1970-09-18', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 3, content: 'Deep Purple - "Machine Head"', start: '1972-03-25', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 4, content: 'Led Zeppelin - "Houses of the Holy"', start: '1973-03-28', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 5, content: 'Iron Maiden - Formation', start: '1975-12-25', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 6, content: 'Judas Priest - "British Steel"', start: '1980-04-14', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 7, content: 'NWOBHM - Nouvelle vague', start: '1979-01-01', end: '1983-12-31', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 8, content: 'Metallica - Formation', start: '1981-10-28', pillar: 'Thrash Metal', className: 'tp-thrash' },
  { id: 9, content: 'Metallica - "Kill \'Em All"', start: '1983-07-25', pillar: 'Thrash Metal', className: 'tp-thrash' },
  { id: 10, content: 'Slayer - "Reign in Blood"', start: '1986-10-07', pillar: 'Thrash Metal', className: 'tp-thrash' },
  { id: 11, content: 'Megadeth - "Peace Sells"', start: '1986-09-19', pillar: 'Thrash Metal', className: 'tp-thrash' },
  { id: 12, content: 'Anthrax - "Among the Living"', start: '1987-03-22', pillar: 'Thrash Metal', className: 'tp-thrash' },
  { id: 13, content: 'Émergence du Death Metal', start: '1983-01-01', end: '1990-12-31', type: 'range', pillar: 'Death Metal', className: 'tp-death' },
  { id: 14, content: 'Death - "Scream Bloody Gore"', start: '1987-05-28', pillar: 'Death Metal', className: 'tp-death' },
  { id: 15, content: 'Morbid Angel - "Altars of Madness"', start: '1989-05-12', pillar: 'Death Metal', className: 'tp-death' },
  { id: 16, content: 'Cannibal Corpse - Formation', start: '1988-12-01', pillar: 'Death Metal', className: 'tp-death' },
  { id: 17, content: 'Première vague Black Metal', start: '1982-01-01', end: '1990-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black' },
  { id: 18, content: 'Seconde vague Black Metal', start: '1991-01-01', end: '1996-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black' },
  { id: 19, content: 'Darkthrone - "A Blaze in the Northern Sky"', start: '1992-02-26', pillar: 'Black Metal', className: 'tp-black' },
  { id: 20, content: 'Mayhem - "De Mysteriis Dom Sathanas"', start: '1994-05-24', pillar: 'Black Metal', className: 'tp-black' },
  { id: 21, content: 'Burzum - "Filosofem"', start: '1996-01-01', pillar: 'Black Metal', className: 'tp-black' },
  { id: 22, content: 'Helloween - "Keeper of the Seven Keys"', start: '1987-05-23', pillar: 'Power Metal', className: 'tp-power' },
  { id: 23, content: 'Blind Guardian - "Somewhere Far Beyond"', start: '1992-03-30', pillar: 'Power Metal', className: 'tp-power' },
  { id: 24, content: 'Explosion du Power Metal', start: '1994-01-01', end: '2000-12-31', type: 'range', pillar: 'Power Metal', className: 'tp-power' },
  { id: 25, content: 'Nightwish - Formation', start: '1996-07-06', pillar: 'Power Metal', className: 'tp-power' },
  { id: 26, content: 'Korn - Premier album', start: '1994-10-11', pillar: 'Metalcore', className: 'tp-metalcore' },
  { id: 27, content: 'Nu Metal - Ère mainstream', start: '1994-01-01', end: '2004-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore' },
  { id: 28, content: 'System of a Down - "Toxicity"', start: '2001-09-04', pillar: 'Metalcore', className: 'tp-metalcore' },
  { id: 29, content: 'Metalcore - Émergence', start: '2000-01-01', end: '2010-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore' },
  { id: 30, content: 'Killswitch Engage - "Alive or Just Breathing"', start: '2002-05-21', pillar: 'Metalcore', className: 'tp-metalcore' },
  { id: 31, content: 'Meshuggah - "Catch Thirtythree"', start: '2005-05-23', pillar: 'Progressive Metal', className: 'tp-progressive' },
  { id: 32, content: 'Periphery - Formation', start: '2005-01-01', pillar: 'Progressive Metal', className: 'tp-progressive' },
  { id: 33, content: 'Djent & Metal progressif', start: '2005-01-01', end: '2015-12-31', type: 'range', pillar: 'Progressive Metal', className: 'tp-progressive' },
  { id: 34, content: 'Renaissance du Heavy Trad', start: '2015-01-01', end: '2026-01-01', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy' },
  { id: 35, content: 'Ghost - "Meliora"', start: '2015-08-21', pillar: 'Heavy Metal', className: 'tp-heavy' },
];

const PILLAR_METADATA: Record<string, { icon: string; color: string }> = {
  'Heavy Metal': { icon: '🎸', color: '#8b0000' },
  'Thrash Metal': { icon: '⚡', color: '#d63031' },
  'Death Metal': { icon: '🩸', color: '#2d3436' },
  'Black Metal': { icon: '💀', color: '#000000' },
  'Power Metal': { icon: '🔥', color: '#e17055' },
  'Doom Metal': { icon: '🌑', color: '#636e72' },
  'Progressive Metal': { icon: '🌀', color: '#00b894' },
  'Folk Metal': { icon: '🍀', color: '#00b894' },
  'Metalcore': { icon: '💥', color: '#6c5ce7' },
};

const CLASS_TO_PILLAR: Record<string, string> = {
  'tp-heavy': 'Heavy Metal',
  'tp-thrash': 'Thrash Metal',
  'tp-death': 'Death Metal',
  'tp-black': 'Black Metal',
  'tp-power': 'Power Metal',
  'tp-doom': 'Doom Metal',
  'tp-progressive': 'Progressive Metal',
  'tp-folk': 'Folk Metal',
  'tp-metalcore': 'Metalcore',
};

export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    let isMounted = true;

    const initTimeline = async () => {
      try {
        const { Timeline, DataSet } = await import('vis-timeline/standalone');
        
        const items = new DataSet(METAL_EVENTS.map((event: any) => ({
          id: event.id,
          content: event.content,
          start: event.start,
          end: event.end,
          type: event.type || 'point',
          className: event.className,
        })));
        
        const options: any = {
          height: '400px',
          start: '1970-01-01',
          end: '2000-01-01',
          min: '1960-01-01',
          max: '2030-12-31',
          orientation: 'top',
          timeAxis: { 
            scale: 'year', 
            step: 5 
          },
          zoomMin: 1000 * 60 * 60 * 24 * 365,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 50,
          moveable: true,
          zoomable: true,
          showCurrentTime: false,
          // ✅ TEMPLATE SÉPARÉ : Range vs Point
          template: function(item: any) {
            // 1. Si c'est une période (range), on affiche une barre de texte stylisée
            if (item.type === 'range') {
              return '<div style="padding: 4px 8px; background: rgba(139, 0, 0, 0.15); border-radius: 4px; border: 1px dashed rgba(62, 39, 35, 0.6); color: #3e2723; font-weight: bold; font-size: 0.75rem; font-family: var(--font-medieval), serif; white-space: nowrap;">' + item.content + '</div>';
            }
            
            // 2. Sinon, c'est un événement ponctuel : on affiche le badge circulaire
            const pillarName = CLASS_TO_PILLAR[item.className] || 'Heavy Metal';
            const pillarData = PILLAR_METADATA[pillarName];
            const icon = pillarData?.icon || '🎸';
            const color = pillarData?.color || '#8b0000';
            
            return '<div class="pillar-badge" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background-color:' + color + ';border:2px solid rgba(255,255,255,0.4);box-shadow:0 4px 6px rgba(0,0,0,0.4);font-size:1.2rem;cursor:pointer;position:relative;z-index:4;">' + icon + '</div>';
          }
        };

        if (isMounted && containerRef.current) {
          timelineRef.current = new Timeline(containerRef.current, items, options);
          
          // Forcer le style des dates
          const applyDateStyles = () => {
            if (typeof window !== 'undefined') {
              const dateElements = document.querySelectorAll('.vis-text');
              dateElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.setProperty('font-family', 'var(--font-medieval), cursive, serif', 'important');
                htmlEl.style.setProperty('color', '#3e2723', 'important');
                htmlEl.style.setProperty('text-shadow', '0 1px 2px rgba(255, 255, 255, 0.4)', 'important');
              });
            }
          };

          setTimeout(applyDateStyles, 50);
          timelineRef.current.on('rangechanged', applyDateStyles);
          timelineRef.current.on('changed', applyDateStyles);
          
          console.log('✅ Timeline initialisée avec 35 événements !');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la timeline:', error);
      }
    };

    initTimeline();

    return () => {
      isMounted = false;
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg">
        <h2 className="text-white text-xl mb-4">Chargement de la Timeline...</h2>
        <div className="bg-gray-800 rounded animate-pulse" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-white text-xl mb-4 text-center font-serif">Timeline MetalPedia</h2>
      <div 
        ref={containerRef} 
        className="timeline-container" 
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
