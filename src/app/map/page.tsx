import type { Metadata } from 'next';
import MetalMapClient from '@/components/map/MetalMapClient';

export const metadata: Metadata = {
  title: 'Metal Map — Densité mondiale des groupes',
  description:
    'Carte 3D interactive montrant la densité des groupes de metal par pays à travers le monde.',
};

export default function MetalMapPage() {
  return (
    <div className="container mx-auto space-y-12">
      <header className="border-b border-metal-gray pb-6 text-center">
        <h1 className="font-metal text-2xl lg:text-4xl text-metal-fire mb-8">
          🌍 Metal Map
        </h1>
        <p className="text-metal-bone font-serif text-base lg:text-lg">
          Densité mondiale des groupes de metal par pays
        </p>
      </header>

      <MetalMapClient />
    </div>
  );
}
