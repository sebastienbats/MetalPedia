import { Suspense } from 'react';
import { metalServerApi } from '@/lib/metal-api';
import PillarsGrid from '@/components/genres/PillarsGrid';
import Loader from '@/components/ui/Loader';
import FloatingRunes from '@/components/ui/FloatingRunes';

export const metadata = {
  title: 'Les 9 Piliers du Metal | MetalPedia',
  description: 'Explorez les 9 grands piliers du metal et découvrez des milliers de groupes classés par sous-genre.',
};

export const dynamic = 'force-dynamic';

export default async function GenresPage() {
  const pillarsStats = await metalServerApi.getGenrePillarsStats();

  return (
    // 🌌 1. Wrapper principal : 'relative' pour contenir les runes, 'min-h-screen' pour couvrir toute la hauteur
    <div className="relative min-h-screen">
      
      {/* 🎵 CALQUE D'ARRIÈRE-PLAN : Les Runes Flottantes (couvre tout l'écran) */}
      <FloatingRunes preset="vortex" family="musical" colorClass="text-red-500" />
      
      {/* 📜 2. CALQUE DE PREMIER PLAN : Le contenu ('relative z-10' pour passer AU-DESSUS des runes) */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        
        <div className="text-center mb-12">
          <h1 className="font-metal text-5xl md:text-6xl text-metal-fire mb-4 drop-shadow-lg">
            Les 9 Piliers du Metal
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto drop-shadow-md">
            Explorez les grands courants du metal et découvrez des milliers de groupes 
            classés par sous-genre. Chaque pilier représente une tradition unique du metal.
          </p>
        </div>

        <Suspense fallback={<Loader text="Chargement des piliers..." />}>
          <PillarsGrid pillarsStats={pillarsStats} />
        </Suspense>
        
      </div>
    </div>
  );
}
