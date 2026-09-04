// src/app/page.tsx
import { Suspense } from 'react';
import { metalServerApi } from '@/lib/metal-api';
import PillarsGrid from '@/components/genres/PillarsGrid';
import Loader from '@/components/ui/Loader';

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
    <div className="container mx-auto px-4 py-12">
      {/* En-tête d'accueil (tu peux personnaliser ce texte si tu veux un message de bienvenue) */}
      <div className="text-center mb-12">
        <h1 className="font-metal text-5xl md:text-6xl text-metal-fire mb-4">
          Bienvenue dans le Metalverse
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Explorez les 9 grands piliers du metal et découvrez des milliers de groupes 
          classés par sous-genre. Chaque pilier représente une tradition unique du metal.
        </p>
      </div>

      {/* Réutilisation exacte du même composant de grille que /genres */}
      <Suspense fallback={<Loader text="Chargement des piliers..." />}>
        <PillarsGrid pillarsStats={pillarsStats} />
      </Suspense>
    </div>
  );
}
