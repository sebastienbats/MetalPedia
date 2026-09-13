'use client';

import { useEffect, useRef, useState } from 'react';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);
  
  // 1. État pour savoir si on est côté client
  const [isClient, setIsClient] = useState(false);

  // 2. On passe à true UNIQUEMENT côté client, après le premier rendu
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 3. Initialisation de la timeline (ne s'exécute que si isClient est true)
  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    let isMounted = true; // Pour éviter les fuites de mémoire si le composant est démonté rapidement

    const initTimeline = async () => {
      try {
        const { Timeline, DataSet } = await import('vis-timeline/standalone');
        
        const items = new DataSet([]);
        
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
        };

        if (isMounted && containerRef.current) {
          timelineRef.current = new Timeline(containerRef.current, items, options);
          console.log('✅ Timeline initialisée avec succès !');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la timeline:', error);
      }
    };

    initTimeline();

    // Nettoyage propre
    return () => {
      isMounted = false;
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [isClient]);

  // 4. RENDU IDENTIQUE serveur et premier rendu client (Élimine l'erreur #418)
  if (!isClient) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg">
        <h2 className="text-white text-xl mb-4">Phase 1 : Squelette de la Timeline</h2>
        {/* Placeholder visuel pendant le chargement côté client */}
        <div className="bg-gray-800 rounded animate-pulse" style={{ height: '400px' }} />
      </div>
    );
  }

  // 5. Vrai rendu une fois que le client a pris le relais
  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-white text-xl mb-4">Phase 1 : Squelette de la Timeline</h2>
      <div 
        ref={containerRef} 
        className="bg-white rounded" 
        style={{ height: '400px' }}
      />
    </div>
  );
}
