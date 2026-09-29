'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ═══════════════════════════════════════════
// ORDRE DES PAGES (Navigation linéaire)
// ═══════════════════════════════════════════
const PAGE_ORDER = [
  '/',                    // Accueil
  '/genres',              // Genres
  '/timeline',            // Timeline
  '/map',                 // Metal Map
  '/quiz',                // Quiz
  '/profile',             // Profil
  '/favorites',           // Favoris
];

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════
const SWIPE_THRESHOLD = 100; // Distance minimale en pixels pour valider un swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Vitesse minimale (px/ms)

export function useSwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Désactiver sur desktop
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches === false) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null || touchStartTime.current === null) {
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      const deltaTime = touchEndTime - touchStartTime.current;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Vérifier que c'est un swipe horizontal (pas vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        // Vérifier la vitesse du swipe
        if (velocity > SWIPE_VELOCITY_THRESHOLD) {
          const currentIndex = PAGE_ORDER.findIndex(page => pathname === page || pathname.startsWith(page + '/'));
          
          if (currentIndex === -1) return; // Page non dans l'ordre

          if (deltaX > 0 && currentIndex > 0) {
            // Swipe vers la droite → Page précédente
            router.push(PAGE_ORDER[currentIndex - 1]);
          } else if (deltaX < 0 && currentIndex < PAGE_ORDER.length - 1) {
            // Swipe vers la gauche → Page suivante
            router.push(PAGE_ORDER[currentIndex + 1]);
          }
        }
      }

      // Reset
      touchStartX.current = null;
      touchStartY.current = null;
      touchStartTime.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pathname, router]);
}
