'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      {/* Icône */}
      <div className="text-7xl mb-6 animate-pulse-slow">📡</div>
      
      {/* Titre */}
      <h1 className="font-metal text-4xl md:text-5xl text-metal-rust mb-4">
        Mode Hors Ligne
      </h1>
      
      {/* Description */}
      <p className="text-gray-400 mb-8 max-w-md text-lg leading-relaxed">
        Vous n'êtes pas connecté à internet. 
        Vos favoris et données locales restent accessibles. 
        La synchronisation reprendra automatiquement dès que la connexion sera rétablie.
      </p>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.location.reload()}
          className="metal-button"
        >
          🔄 Réessayer la connexion
        </button>
        
        <Link href="/" className="metal-button opacity-80 hover:opacity-100">
          🏠 Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
