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
      {/* 🚨 MODE DÉBOGAGE ULTIME : TOUT DEVANT, Z-INDEX MASSIF, OPAQUE */}
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
        
        {/* Les notes en ROUGE VIF et 100% OPAQUES */}
        <FloatingRunes 
          preset="storm" 
          family="musical" 
          colorClass="text-red-500" 
          opacityFactor={1.0} // 100% visible, aucune transparence
          count={40}
          maxScale={8}
        />
        
        {/* Texte de preuve que le calque est devant */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 font-bold text-xl border-4 border-white rounded shadow-2xl pointer-events-none animate-pulse">
          🚨 DEBUG : SI TU VOIS CE TEXTE, LE CALQUE EST DEVANT ! 🚨
        </div>
      </div>
      
      {/* Contenu de la page en dessous */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-metal text-5xl md:text-6xl text-metal-fire mb-4">
            Les 9 Piliers du Metal
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Regarde attentivement l'écran : vois-tu des notes de musique <strong className="text-red-500">ROUGES et OPAQUES</strong> flotter par-dessus ce texte ?
          </p>
        </div>

        <Suspense fallback={<Loader text="Chargement des piliers..." />}>
          <PillarsGrid pillarsStats={pillarsStats} />
        </Suspense>
      </div>
    </>
  );
}
