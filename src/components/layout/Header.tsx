'use client';

import Link from 'next/link';
import { useFavoritesCount } from '@/stores/favoritesStore';
import SearchBar from '@/components/search/SearchBar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function Header() {
  // Récupère le nombre de favoris en temps réel depuis le store
  const favCount = useFavoritesCount();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-metal-black/90 border-b border-metal-gray">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl">
        
        {/* Logo et Titre */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-4xl animate-flame">🔥</span>
          <div>
            <h1 className="font-metal text-3xl md:text-4xl text-metal-rust group-hover:text-metal-fire transition-colors">
              MetalPedia
            </h1>
            <p className="text-xs text-gray-400 font-serif tracking-widest uppercase">
              Encyclopédie du Metal
            </p>
          </div>
        </Link>
        
        {/* Barre de recherche et Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-96">
            <SearchBar />
          </div>
          
          {/* 🎯 LIEN FAVORIS AVEC COMPTEUR DYNAMIQUE */}
          <Link 
            href="/favorites" 
            className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-metal-fire hover:bg-metal-gray/30 transition-all"
            aria-label="Mes favoris"
            title="Mes favoris"
          >
            <span className="text-xl">❤️</span>
            
            {/* Badge compteur (affiché uniquement si > 0) */}
            {favCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-metal-fire text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-metal-black">
                {favCount > 99 ? '99+' : favCount}
              </span>
            )}
          </Link>

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
