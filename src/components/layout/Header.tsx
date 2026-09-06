'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFavoritesCount, useFavoritesHydration } from '@/stores/favoritesStore';
import { useAuth, useSignOut } from '@/api/authApi';
import SearchBar from '@/components/search/SearchBar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function Header() {
  const favCount = useFavoritesCount();
  const { isHydrated } = useFavoritesHydration();
  
  const { data: user } = useAuth();
  const signOutMutation = useSignOut();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-metal-black/90 border-b border-metal-gray">
      <div className="container mx-auto px-4 py-3 md:py-4 max-w-7xl">
        
        {/* ═══════════════════════════════════════════
            LIGNE 1 : Logo + Actions (sur toutes les tailles d'écran)
            ═══════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo et Titre */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <span className="text-3xl md:text-4xl animate-flame">🔥</span>
            <div>
              <h1 className="font-metal text-2xl md:text-4xl text-metal-rust group-hover:text-metal-fire transition-colors">
                MetalPedia
              </h1>
              <p className="hidden sm:block text-xs text-gray-400 font-serif tracking-widest uppercase">
                Encyclopédie du Metal
              </p>
            </div>
          </Link>

          {/* Actions utilisateur (Favoris, Profil/Connexion, Thème) */}
          <div className="flex items-center gap-1 md:gap-2">
            
            {/* LIEN FAVORIS */}
            <Link 
              href="/favorites" 
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-metal-fire hover:bg-metal-gray/30 transition-all"
              aria-label="Mes favoris"
              title="Mes favoris"
            >
              <span className="text-xl">❤️</span>
              {isHydrated && favCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-metal-fire text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-metal-black">
                  {favCount > 99 ? '99+' : favCount}
                </span>
              )}
            </Link>

            {/* SECTION UTILISATEUR */}
            {user ? (
              <>
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-metal-fire hover:bg-metal-gray/30 transition-all"
                  title="Mon Profil"
                >
                  <span className="text-xl">👤</span>
                  <span className="hidden md:inline font-medium">Profil</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={signOutMutation.isPending}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
                  title="Se déconnecter"
                >
                  <span className="text-xl">🚪</span>
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="px-3 py-2 md:px-4 bg-metal-fire text-white font-semibold rounded-lg hover:bg-metal-fire/80 transition-all text-sm"
              >
                <span className="hidden sm:inline">Connexion</span>
                <span className="sm:hidden">🔑</span>
              </Link>
            )}

            <ThemeSwitcher />
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            LIGNE 2 : Barre de recherche (pleine largeur sur mobile)
            ═══════════════════════════════════════════ */}
        <div className="mt-3 md:mt-4">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
