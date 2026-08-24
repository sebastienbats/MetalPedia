import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import MetalMapClient from '@/components/map/MetalMapClient';

export const metadata: Metadata = {
  title: 'Metal Map — Densité mondiale des groupes',
  description:
    'Carte 3D interactive montrant la densité des groupes de metal par pays à travers le monde.',
};

export default function MetalMapPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-metal-gray pb-6 text-center">
        <h1 className="font-metal text-5xl text-metal-rust mb-3">🌍 Metal Map</h1>
        <p className="text-gray-400 font-serif">
          Densité mondiale des groupes de metal par pays
        </p>
      </header>

      <MetalMapClient />
    </div>
  );
}
