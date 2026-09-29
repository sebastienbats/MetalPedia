'use client';

import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

export default function SwipeNavigationInitializer() {
  useSwipeNavigation();
  return null; // Ce composant n'a pas de rendu visuel
}
