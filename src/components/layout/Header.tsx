'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFavoritesCount, useFavoritesHydration } from '@/stores/favoritesStore';
import { useAuth, useSignOut } from '@/api/authApi';
import SearchBar from '@/components/search/SearchBar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import RandomBandButton from '@/components/layout/RandomBandButton';
import PillarsDropdown from '@/components/layout/PillarsDropdown';

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: user } = useAuth();
  const signOutMutation = useSignOut();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
    setIsOpen(false);
    router.push('/');
  };

  if (!user) {
    return (
      <Link
        href="/login"
        title="Se connecter"
        className="shrink-0 flex items-center justify-center h-8 sm:h-9 md:h-10 px-2 sm:px-2.5 md:px-4 bg-metal-fire text-white font-semibold rounded-lg hover:bg-metal-fire/80 transition-all text-sm"
      >
        <span className="sm:hidden text-base">🔑</span>
        <span className="hidden sm:inline">Connexion</span>
      </Link>
    );
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Mon compte"
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg text-gray-300 hover:text-metal-fire hover:bg-metal-gray/30 transition-all focus:outline-none focus:ring-2 focus:ring-metal-fire/50"
      >
        <span className="text-lg sm:text-xl">👤</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 metal-card border-2 border-metal-gray rounded-xl p-1.5 shadow-2xl z-50 animate-slide-up"
        >
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-metal-fire/10 hover:text-metal-fire transition-colors"
          >
            <span aria-hidden="true">👤</span> Mon profil
          </Link>
          <button
            onClick={handleLogout}
            disabled={signOutMutation.isPending}
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors disabled:opacity-60"
          >
            <span aria-hidden="true">🚪</span>
            {signOutMutation.isPending ? 'Déconnexion...' : 'Déconnexion'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const favCount = useFavoritesCount();
  const { isHydrated } = useFavoritesHydration();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-metal-black/90 border-b border-metal-gray">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
        {/* ✅ Gap réduit sur mobile (gap-1 au lieu de gap-1.5) */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 h-14 md:h-16">
          <Link
            href="/"
            className="shrink-0 flex items-center gap-2 group"
            aria-label="MetalPedia — Accueil"
          >
            <span className="text-2xl md:text-3xl animate-flame" aria-hidden="true">
              🔥
            </span>
            <div className="hidden lg:block leading-tight">
              <h1 className="font-metal text-xl text-metal-rust group-hover:text-metal-fire transition-colors">
                MetalPedia
              </h1>
              <p className="text-[9px] text-gray-400 font-serif tracking-widest uppercase">
                Encyclopédie du Metal
              </p>
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <SearchBar />
          </div>

          <RandomBandButton />

          <PillarsDropdown />

          <Link
            href="/favorites"
            className="relative shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg text-gray-300 hover:text-metal-fire hover:bg-metal-gray/30 transition-all"
            aria-label="Mes favoris"
            title="Mes favoris"
          >
            <span className="text-lg sm:text-xl">❤️</span>
            {isHydrated && favCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-metal-fire text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-metal-black">
                {favCount > 99 ? '99+' : favCount}
              </span>
            )}
          </Link>

          <UserMenu />

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
