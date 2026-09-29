'use client';

import { useEffect, useState } from 'react';

export default function SwipeIndicator() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher uniquement sur mobile
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      setIsVisible(true);
      
      // Masquer après 5 secondes
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-metal-black/80 backdrop-blur-md border border-metal-gray rounded-full px-4 py-2 flex items-center gap-2 text-xs text-gray-400 shadow-lg">
        <span>←</span>
        <span>Swipe pour naviguer</span>
        <span>→</span>
      </div>
    </div>
  );
}
