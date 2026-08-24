import type { Metadata } from 'next';
import TimelineClient from '@/components/timeline/TimelineClient';

export const metadata: Metadata = {
  title: 'Timeline du Metal — 60 ans d\'histoire',
  description:
    'Chronologie interactive de l\'histoire du metal, de Black Sabbath à nos jours.',
};

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-metal-gray pb-6 text-center">
        <h1 className="font-metal text-5xl text-metal-rust mb-3">📜 Timeline du Metal</h1>
        <p className="text-gray-400 font-serif">
          60 ans d'histoire du metal, 1968 → 2026
        </p>
      </header>

      <TimelineClient />
    </div>
  );
}
