'use client';

import Link from 'next/link';
import { useFavoritesCount, useFavoritesHydrated } from '@/stores/favoritesStore';
import { useAuth } from '@/api/authApi'; // 🆕 Import du hook d'auth
import { useSignOut } from '@/api/authApi'; // 🆕 Import du hook de déconnexion
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function Header() {
  const favCount = useFavoritesCount();
  const hydrated = useFavoritesHydrated();
  
  // 🆕 Récupérer l'état d'authentification
  const { data: user } = useAuth();
  const signOutMutation = useSignOut();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
    router.push('/'); // Redirection vers l'accueil après déconnexion
  };

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
          
          {/* LIEN FAVORIS */}
          <Link 
            href="/favorites" 
            className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-metal-fire hover:bg-metal-gray/30 transition-all"
            aria-label="Mes favoris"
            title="Mes favoris"
          >
            <span className="text-xl">❤️</span>
            {hydrated && favCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-metal-fire text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-metal-black">
                {favCount > 99 ? '99+' : favCount}
              </span>
            )}
          </Link>

          {/* 🆕 SECTION UTILISATEUR (Connecté ou Non) */}
          {user ? (
            <div className="flex items-center gap-2">
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
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-4 py-2 bg-metal-fire text-white font-semibold rounded-lg hover:bg-metal-fire/80 transition-all text-sm"
            >
              Connexion
            </Link>
          )}

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
