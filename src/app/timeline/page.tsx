import type { Metadata } from 'next';
import TimelineClientWrapper from '@/components/timeline/TimelineClientWrapper';

// ═══════════════════════════════════════════════════════════
// MÉTADONNÉES SEO DE LA PAGE (Server Component)
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
// PAGE TIMELINE (Server Component)
// ═══════════════════════════════════════════════════════════
export default function TimelinePage() {
  return (
    <div className="container mx-auto max-w-7xl py-8">
      {/* Introduction */}
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

      {/* ✅ Le wrapper Client Component est injecté ici */}
      <TimelineClientWrapper />
    </div>
  );
}
