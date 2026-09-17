// src/app/[locale]/timeline/page.tsx
// ou src/app/fr/timeline/page.tsx selon ta structure de routes

import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

// ═══════════════════════════════════════════════════════════
// IMPORT DYNAMIQUE AVEC SSR DÉSACTIVÉ
// ═══════════════════════════════════════════════════════════
// ✅ Option A : vis-timeline manipule le DOM directement,
// donc il NE PEUT PAS fonctionner côté serveur (SSR).
// Next.js ne pré-rendra PAS ce composant sur le serveur,
// éliminant définitivement l'erreur d'hydratation React #418.
// ═══════════════════════════════════════════════════════════
const TimelineClient = dynamic(
  () => import('@/components/timeline/TimelineClient'),
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

// ═══════════════════════════════════════════════════════════
// MÉTADONNÉES SEO DE LA PAGE
// ═══════════════════════════════════════════════════════════
export const metadata: Metadata = {
  title: 'Timeline du Metalverse',
  description:
    'Explorez 85 événements légendaires du Metal : de Black Sabbath (1968) à Spiritbox (2021). Chaque événement révèle un fragment du Codex avec 9 visions narratives exclusives selon votre classe.',
  keywords: [
    'metal timeline',
    'heavy metal history',
    'black metal',
    'death metal',
    'thrash metal',
    'power metal',
    'doom metal',
    'progressive metal',
    'folk metal',
    'metalcore',
  ],
  openGraph: {
    title: 'Timeline du Metalverse 🤘 85 Événements Légendaires',
    description:
      'Du Premier Riff de 1968 à la Renaissance de 2021. Explorez l\'histoire du Metal à travers le prisme du Metalverse.',
  },
};

// ═══════════════════════════════════════════════════════════
// PAGE TIMELINE
// ═══════════════════════════════════════════════════════════
export default function TimelinePage() {
  return (
    <div className="container mx-auto max-w-7xl py-8">
      {/* Introduction optionnelle */}
      <div className="text-center mb-8 px-4">
        <h1 className="font-metal text-4xl md:text-5xl text-metal-rust mb-4">
          📜 Le Codex du Metalverse
        </h1>
        <p className="text-gray-400 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
          Quatre-vingt-cinq fragments arrachés à l'Oubli. Chaque événement révèle 
          neuf visions narratives — une par classe du Conseil. Choisis ta destinée 
          et découvre ce que les autres ne peuvent pas voir.
        </p>
      </div>

      {/* ✅ Le composant TimelineClient est injecté ici, sans SSR */}
      <TimelineClient />
    </div>
  );
}
