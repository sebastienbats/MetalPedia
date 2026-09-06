'use client';

import { useState, useEffect, useRef } from 'react';
import { useUIStore, Theme } from '@/stores/uiStore';

const THEMES: { id: Theme; icon: string; name: string }[] = [
  { id: 'forge', icon: '⚒️', name: 'Forge' },
  { id: 'cathedral', icon: '🏰', name: 'Cathédrale' },
  { id: 'hellfire', icon: '🔥', name: 'Hellfire' },
  { id: 'frost', icon: '❄️', name: 'Frost' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (themeId: Theme) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ═══════════════════════════════════════════
          VERSION MOBILE : Bouton unique + Dropdown
          ═══════════════════════════════════════════ */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg bg-metal-dark border border-metal-gray flex items-center justify-center hover:border-metal-fire transition-all"
          aria-label="Changer de thème"
          aria-expanded={isOpen}
          title={`Thème actuel : ${currentTheme.name}`}
        >
          <span className="text-lg">{currentTheme.icon}</span>
        </button>

        {/* Menu déroulant */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 metal-card border border-metal-gray shadow-2xl z-50 overflow-hidden animate-fade-in">
            <div className="p-2 border-b border-metal-gray">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Choisir un thème
              </p>
            </div>
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => handleSelect(th.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                  theme === th.id
                    ? 'bg-metal-fire/20 text-metal-fire'
                    : 'text-gray-300 hover:bg-metal-gray/50 hover:text-white'
                }`}
              >
                <span className="text-xl">{th.icon}</span>
                <span className="font-medium text-sm">{th.name}</span>
                {theme === th.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 ml-auto text-metal-fire"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          VERSION DESKTOP : 4 boutons en ligne
          ═══════════════════════════════════════════ */}
      <div className="hidden md:flex gap-1 bg-metal-dark border border-metal-gray rounded-full p-1">
        {THEMES.map((th) => (
          <button
            key={th.id}
            onClick={() => setTheme(th.id)}
            title={th.name}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              theme === th.id
                ? 'bg-metal-gray scale-110 shadow-lg'
                : 'hover:bg-metal-gray/50'
            }`}
          >
            <span className="text-lg">{th.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
