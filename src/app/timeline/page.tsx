import type { Metadata } from 'next';
import TimelineClientWrapper from '@/components/timeline/TimelineClientWrapper';

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

export default function TimelinePage() {
  return (
    // ✅ Mobile Full-Width
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12 sm:max-w-7xl sm:mx-auto">
      <div className="text-center mb-4 sm:mb-8">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2 sm:mb-4">
          📜 Le Codex du Metalverse
        </h1>
        <p className="text-metal-bone font-serif text-xs sm:text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          Quatre-vingt-cinq fragments arrachés à l'Oubli. Chaque événement révèle
          neuf visions narratives — une par classe du Conseil. Choisis ta destinée
          et découvre ce que les autres ne peuvent pas voir.
        </p>
      </div>

      <TimelineClientWrapper />
    </div>
  );
}
