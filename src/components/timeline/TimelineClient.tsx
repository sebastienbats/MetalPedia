'use client';

import { useEffect, useRef, useState } from 'react';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

// ═══════════════════════════════════════════
// DONNÉES : 35 ÉVÉNEMENTS METAL
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// SCEAUX DE CIRE (6 marqueurs de décennies)
// ═══════════════════════════════════════════
const WAX_SEALS = [
  { id: 1001, content: '1970', start: '1975-01-01', className: 'tp-wax-seal' },
  { id: 1002, content: '1980', start: '1985-01-01', className: 'tp-wax-seal' },
  { id: 1003, content: '1990', start: '1995-01-01', className: 'tp-wax-seal' },
  { id: 1004, content: '2000', start: '2005-01-01', className: 'tp-wax-seal' },
  { id: 1005, content: '2010', start: '2015-01-01', className: 'tp-wax-seal' },
  { id: 1006, content: '2020', start: '2025-01-01', className: 'tp-wax-seal' },
];

// ✅ FUSION DES ÉVÉNEMENTS ET DES SCEAUX
const ALL_ITEMS = [...METAL_EVENTS, ...WAX_SEALS];

// ═══════════════════════════════════════════
// MÉTADONNÉES DES PILIERS (couleurs et icônes)
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// MAPPING className -> Nom complet du pilier
// ══════════════════════════════════════════
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
        
        const items = new DataSet(ALL_ITEMS.map((event: any) => ({
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
          template: (item: any) => {
          // ✅ Option nucléaire : style inline garanti pour les sceaux
          template: (item: any) => {
            // ✅ TEST DE DÉBOGAGE : On affiche le className dans la console
            console.log('🔍 ITEM:', item.content, '| className:', item.className);

            // ✅ On force la vérification en convertissant tout en string
            const classStr = String(item.className || '');
            
            if (classStr.includes('wax-seal')) {
              // ✅ STYLE INLINE ULTRA-VISIBLE (ROUGE VIF) pour tester si le template est bien appelé
              return `<div style="background: red !important; color: white !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: bold !important; border: 2px solid darkred !important;">${item.content}</div>`;
            }
            
            const pillarName = CLASS_TO_PILLAR[item.className] || 'Heavy Metal';
            const pillarData = PILLAR_METADATA[pillarName];
            const icon = pillarData?.icon || '🎸';
            const color = pillarData?.color || '#8b0000';
            
            return `<div class="parchment-icon" style="--pillar-color: ${color};">${icon}</div>`;
          },
        };

        if (isMounted && containerRef.current) {
          timelineRef.current = new Timeline(containerRef.current, items, options);
          
          // ✅ 1. Forcer le style des dates
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

          // ✅ 2. Forcer le style des sceaux de cire
          const applyWaxSealStyles = () => {
            if (typeof window !== 'undefined') {
              const sealElements = document.querySelectorAll('.vis-item.tp-wax-seal .vis-item-content');
              sealElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                const iconDiv = htmlEl.querySelector('.wax-seal-icon');
                if (iconDiv) {
                  iconDiv.setAttribute('style', 
                    'display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; height: 36px !important; border-radius: 50% !important; background: radial-gradient(circle at 35% 35%, #c62828 0%, #8b0000 50%, #5d0000 100%) !important; border: 2px solid #3e0000 !important; font-family: var(--font-medieval), cursive, serif !important; font-size: 0.7rem !important; font-weight: 700 !important; color: #fff3e0 !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important; cursor: pointer !important; z-index: 10 !important;'
                  );
                }
              });
            }
          };

          // ✅ 3. Fonction combinée pour appliquer les deux styles
          const applyAllStyles = () => {
            applyDateStyles();
            applyWaxSealStyles();
          };

          // Appliquer après un court délai pour laisser vis-timeline finir le rendu DOM
          setTimeout(applyAllStyles, 50);

          // Et aussi après chaque changement de vue (zoom, scroll, déplacement)
          timelineRef.current.on('rangechanged', applyAllStyles);
          timelineRef.current.on('changed', applyAllStyles);
          
          console.log('✅ Timeline initialisée avec 35 événements + 6 sceaux !');
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
        <h2 className="text-white text-xl mb-4">Phase 4 : Les Événements Metal</h2>
        <div className="bg-gray-800 rounded animate-pulse" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-white text-xl mb-4 text-center font-serif">Phase 4 : Les Événements Metal</h2>
      <div 
        ref={containerRef} 
        className="timeline-container" 
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
