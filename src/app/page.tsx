// src/app/page.tsx
import { Suspense } from 'react';
import { metalServerApi } from '@/lib/metal-api';
import PillarsGrid from '@/components/genres/PillarsGrid';
import Loader from '@/components/ui/Loader';
import FloatingRunes from '@/components/ui/FloatingRunes'; // 🆕 Import du composant

// Métadonnées spécifiques à la page d'accueil (bon pour le SEO)
export const metadata = {
  title: 'MetalPedia - L\'Encyclopédie du Metal',
  description: 'Explorez les 9 grands piliers du metal, découvrez des milliers de groupes classés par sous-genre et progressez dans votre quête metal.',
};

// Force le rendu dynamique pour récupérer les dernières statistiques en temps réel
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // On récupère exactement les mêmes données que la page /genres
  const pillarsStats = await metalServerApi.getGenrePillarsStats();

  return (
    <>
      {/* 🌌 CALQUE D'ARRIÈRE-PLAN : Ambiance Metalverse subtile */}
      {/* z-10 : AU-DESSUS du fond opaque du body, mais DERRIÈRE le contenu */}
      <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
        <FloatingRunes 
          preset="breeze" 
          family="cosmic" 
          colorClass="text-amber-300"
          opacityFactor={0.10} // Très subtil pour l'accueil
        />
      </div>
      
      {/* 📜 CALQUE DE PREMIER PLAN : Contenu principal */}
      {/* z-20 : AU-DESSUS des runes pour garantir la lisibilité */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        
        {/* En-tête d'accueil */}
        <div className="text-center mb-12">
          <h1 className="font-metal text-5xl md:text-6xl text-metal-fire mb-4 drop-shadow-lg">
            Bienvenue dans le Metalverse
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto drop-shadow-md">
            Explorez les 9 grands piliers du metal et découvrez des milliers de groupes 
            classés par sous-genre. Chaque pilier représente une tradition unique du metal.
          </p>
        </div>

        {/* Grille des piliers */}
        <Suspense fallback={<Loader text="Chargement des piliers..." />}>
          <PillarsGrid pillarsStats={pillarsStats} />
        </Suspense>
        
      </div>
    </>
  );
}
