'use client';

import dynamic from 'next/dynamic';

// ═══════════════════════════════════════════════════════════
// IMPORT DYNAMIQUE AVEC SSR DÉSACTIVÉ
// ═══════════════════════════════════════════════════════════
// Ce composant est un CLIENT COMPONENT ('use client')
// donc next/dynamic avec ssr: false est autorisé ici.
// ═══════════════════════════════════════════════════════════
const TimelineClient = dynamic(
  () => import('./TimelineClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full px-4 md:px-8">
        <h2 className="text-white text-xl mb-4 text-center font-serif">
          Timeline MetalPedia — Chargement du Codex...
        </h2>
        <div 
          className="w-full rounded-xl animate-pulse border-3 border-metal-fire/30"
          style={{ 
            height: '500px',
            background: 'rgba(245, 230, 211, 0.1)',
            borderColor: '#8b4513'
          }}
        />
      </div>
    ),
  }
);

export default function TimelineClientWrapper() {
  return <TimelineClient />;
}
