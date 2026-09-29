import type { Metadata } from 'next';
import MetalMapClient from '@/components/map/MetalMapClient';

export const metadata: Metadata = {
  title: 'Metal Map — Densité mondiale des groupes',
  description:
    'Carte 3D interactive montrant la densité des groupes de metal par pays à travers le monde.',
};

export default function MetalMapPage() {
  return (
    // ✅ Mobile Full-Width
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12 space-y-6 sm:space-y-12">
      <header className="border-b border-metal-gray pb-4 sm:pb-6 text-center">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2 sm:mb-4">
          🌍 Metal Map
        </h1>
        <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg">
          Densité mondiale des groupes de metal par pays
        </p>
      </header>

      <MetalMapClient />
    </div>
  );
}
