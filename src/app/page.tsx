// src/app/page.tsx
import { Suspense } from 'react';
import { metalServerApi } from '@/lib/metal-api';
import PillarsGrid from '@/components/genres/PillarsGrid';
import Loader from '@/components/ui/Loader';
import FloatingRunes from '@/components/ui/FloatingRunes';

export const metadata = {
  title: 'MetalPedia - L\'Encyclopédie du Metal',
  description: 'Explorez les 9 grands piliers du metal, découvrez des milliers de groupes classés par sous-genre et progressez dans votre quête metal.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const pillarsStats = await metalServerApi.getGenrePillarsStats();

  return (
    <>
      <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
        <FloatingRunes
          preset="vortex"
          family="musical"
          colorClass="text-amber-300"
          opacityFactor={0.10}
        />
      </div>

      <div className="relative z-20 container mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-metal text-2xl lg:text-4xl text-metal-fire mb-8 drop-shadow-lg">
            Bienvenue dans le Metalverse
          </h1>
          <p className="text-metal-bone font-serif text-base lg:text-lg max-w-2xl mx-auto drop-shadow-md">
            Explorez les 9 grands piliers du metal et découvrez des milliers de groupes 
            classés par sous-genre. Chaque pilier représente une tradition unique du metal.
          </p>
        </div>

        <Suspense fallback={<Loader text="Chargement des piliers..." />}>
          <PillarsGrid pillarsStats={pillarsStats} />
        </Suspense>
      </div>
    </>
  );
}
