import { Suspense } from 'react';
import { metalServerApi } from '@/lib/metal-api';
import PillarsGrid from '@/components/genres/PillarsGrid';
import Loader from '@/components/ui/Loader';
import FloatingRunes from '@/components/ui/FloatingRunes';

export const metadata = {
  title: 'Les 9 Piliers du Metal | MetalPedia',
  description: 'Explorez les 9 grands piliers du metal.',
};

export const dynamic = 'force-dynamic';

export default async function GenresPage() {
  const pillarsStats = await metalServerApi.getGenrePillarsStats();

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-metal-black">
        <FloatingRunes 
          preset="storm" 
          family="musical" 
          colorClass="text-red-500" 
          opacityFactor={0.9} 
          count={20}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-metal text-5xl md:text-6xl text-metal-fire mb-4">
            Les 9 Piliers du Metal
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Test d'affichage des runes en arrière-plan.
          </p>
        </div>
        <Suspense fallback={<Loader text="Chargement..." />}>
          <PillarsGrid pillarsStats={pillarsStats} />
        </Suspense>
      </div>
    </>
  );
}
