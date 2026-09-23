'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RandomBandButton() {
  const router = useRouter();
  const [isRolling, setIsRolling] = useState(false);

  const rollTheDice = async () => {
    if (isRolling) return;
    setIsRolling(true);

    try {
      const res = await fetch('/api/bands/random');
      if (!res.ok) throw new Error('Random fetch failed');
      const band = await res.json();

      setIsRolling(false);
      router.push(`/band/${band.id}`);
    } catch (error) {
      console.error('[RandomBandButton] Erreur:', error);
      setIsRolling(false);
    }
  };

  return (
    <button
      onClick={rollTheDice}
      disabled={isRolling}
      title="Groupe aléatoire"
      aria-label="Découvrir un groupe aléatoire"
      className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg border border-metal-gray bg-metal-black/40 text-base sm:text-lg md:text-xl hover:border-metal-fire/60 hover:bg-metal-fire/10 transition-all focus:outline-none focus:ring-2 focus:ring-metal-fire/50 disabled:opacity-60 disabled:cursor-wait"
    >
      <span
        className={`inline-block ${isRolling ? 'animate-spin' : 'transition-transform hover:rotate-12'}`}
        aria-hidden="true"
      >
        🎲
      </span>
    </button>
  );
}
