'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { useFavoritesStore } from '@/stores/favoritesStore';

export default function CommandPalette() {
  const { commandPaletteOpen, openCommandPalette, closeCommandPalette } = useUIStore();
  const [query, setQuery] = useState('');
  const router = useRouter();
  const favorites = useFavoritesStore((s) => s.favorites);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPaletteOpen ? closeCommandPalette() : openCommandPalette();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, openCommandPalette, closeCommandPalette]);

  if (!commandPaletteOpen) return null;

  const go = (path: string) => {
    router.push(path);
    closeCommandPalette();
  };

  return (
    <div className="fixed inset-0 z-command-palette bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-[15vh]" onClick={closeCommandPalette}>
      <Command className="w-full max-w-2xl metal-card" onClick={(e) => e.stopPropagation()}>
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Rechercher..."
          className="w-full px-5 py-4 bg-transparent border-b border-metal-gray"
          autoFocus
        />
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="p-6 text-center text-gray-400">Aucun résultat...</Command.Empty>

          {Object.values(favorites).slice(0, 5).map((band) => (
            <Command.Item key={band.id} onSelect={() => go(`/band/${band.id}`)} className="px-3 py-2 rounded-md cursor-pointer aria-selected:bg-metal-gray">
              ⭐ {band.name}
            </Command.Item>
          ))}

          <Command.Group heading="Navigation">
            <Command.Item onSelect={() => go('/')} className="px-3 py-2 rounded-md cursor-pointer aria-selected:bg-metal-gray">🏠 Accueil</Command.Item>
            <Command.Item onSelect={() => go('/profile')} className="px-3 py-2 rounded-md cursor-pointer aria-selected:bg-metal-gray">⚔️ Mon profil</Command.Item>
            <Command.Item onSelect={() => go('/favorites')} className="px-3 py-2 rounded-md cursor-pointer aria-selected:bg-metal-gray">⭐ Mes favoris</Command.Item>
            <Command.Item onSelect={() => go('/map')} className="px-3 py-2 rounded-md cursor-pointer aria-selected:bg-metal-gray">🌍 Metal Map</Command.Item>
            <Command.Item onSelect={() => go('/timeline')} className="px-3 py-2 rounded-md cursor-pointer aria-selected:bg-metal-gray">📜 Timeline</Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
