'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PILLAR_METADATA, GAMIFICATION_PILLARS } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// 🏛️ MENU DÉROULANT DES 9 PILIERS
// ═══════════════════════════════════════════════════════════
function shortLabel(pillar: string): string {
  if (pillar === 'Progressive Metal') return 'Prog';
  if (pillar === 'Metalcore') return 'Core';
  return pillar.replace(' Metal', '');
}

export default function PillarsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermeture : clic extérieur + Escape
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

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Les 9 Piliers du Metalverse"
        aria-label="Ouvrir le menu des 9 piliers"
        className={`flex items-center gap-1 px-2 h-9 md:h-10 rounded-lg border text-lg md:text-xl transition-all focus:outline-none focus:ring-2 focus:ring-metal-fire/50 ${
          isOpen
            ? 'border-metal-fire bg-metal-fire/10'
            : 'border-metal-gray bg-metal-black/40 hover:border-metal-fire/60 hover:bg-metal-fire/10'
        }`}
      >
        <span aria-hidden="true">🏛️</span>
        <span
          className={`text-[8px] text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 metal-card border-2 border-metal-gray rounded-xl p-1.5 shadow-2xl z-50 animate-slide-up"
        >
          <p className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-metal-gray/50 mb-1">
            Les 9 Piliers du Metalverse
          </p>

          <div className="grid grid-cols-1 gap-0.5">
            {GAMIFICATION_PILLARS.map((pillar) => {
              const metadata = PILLAR_METADATA[pillar];
              return (
                <Link
                  key={pillar}
                  href={`/genres/${encodeURIComponent(pillar)}`}
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-metal-fire/10 transition-colors group"
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg border shrink-0"
                    style={{
                      backgroundColor: `${metadata.color}18`,
                      borderColor: `${metadata.color}60`,
                    }}
                    aria-hidden="true"
                  >
                    {metadata.icon}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-200 group-hover:text-metal-fire transition-colors">
                    {pillar}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                    style={{
                      color: metadata.color,
                      borderColor: `${metadata.color}60`,
                      backgroundColor: `${metadata.color}10`,
                    }}
                  >
                    {shortLabel(pillar)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
