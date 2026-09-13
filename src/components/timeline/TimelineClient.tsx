'use client';

import { useEffect, useRef, useState } from 'react';
// On importe le CSS de base de vis-timeline
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  // 1. Sécurité pour le SSR (Server-Side Rendering)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Initialisation de la timeline
  useEffect(() => {
    // On n'initialise que côté client
    if (!mounted || typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const initTimeline = async () => {
      try {
        // Import dynamique pour éviter les erreurs SSR
        const { Timeline, DataSet } = await import('vis-timeline/standalone');
        
        // Dataset vide pour l'instant
        const items = new DataSet([]);

        // Configuration de base
        const options = {
          height: '400px',
          start: '1970-01-01',
          end: '2000-01-01',
          min: '1960-01-01',
          max: '2030-12-31',
          orientation: 'top',
          // ✅ C'est ici la magie : on demande les dates tous les 5 ans
          timeAxis: { 
            scale: 'year', 
            step: 5 
          },
          zoomMin: 1000 * 60 * 60 * 24 * 365, // Zoom max = 1 an
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 50, // Zoom min = 50 ans
          moveable: true,
          zoomable: true,
        };

        // Création de l'instance
        timelineRef.current = new Timeline(container, items, options);
        
        console.log('✅ Timeline initialisée avec succès !');
      } catch (error) {
        console.error(' Erreur lors de l\'initialisation de la timeline:', error);
      }
    };

    initTimeline();

    // Nettoyage à la destruction du composant
    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [mounted]);

  // 3. Rendu minimal
  if (!mounted) return null;

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-white text-xl mb-4">Phase 1 : Squelette de la Timeline</h2>
      {/* suppressHydrationWarning est ajouté dès le début pour éviter le bug React #418 */}
      <div 
        ref={containerRef} 
        className="bg-white rounded" 
        style={{ height: '400px' }}
        suppressHydrationWarning 
      />
    </div>
  );
}
