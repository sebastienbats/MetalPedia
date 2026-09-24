'use client';

import { useState } from 'react';
import Link from 'next/link';
import QuizGame from '@/components/quiz/QuizGame';
import { GAMIFICATION_PILLARS, type GamificationPillar } from '@/types/api';
import { getClassMetadata } from '@/lib/gamification/classes';
import { useClassMetadata } from '@/stores/classStore';

export default function QuizPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<GamificationPillar | 'all'>('all');
  const [results, setResults] = useState<{ totalXp: number; correctCount: number; totalCount: number } | null>(null);

  const userClass = useClassMetadata();

  const handleStart = () => {
    setIsPlaying(true);
    setResults(null);
  };

  const handleComplete = (totalXp: number, correctCount: number, totalCount: number) => {
    setResults({ totalXp, correctCount, totalCount });
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setResults(null);
    setIsPlaying(true);
  };

  // ─────────────────────────────────────────────────────
  // ÉCRAN DE RÉSULTATS
  // ─────────────────────────────────────────────────────
  if (results) {
    const percentage = Math.round((results.correctCount / results.totalCount) * 100);
    let message = "Les ténèbres t'ont trompé...";
    if (percentage >= 80) message = "Tu es un véritable érudit du Metalverse !";
    else if (percentage >= 60) message = "Tu connais bien tes classiques, Métalleux.";
    else if (percentage >= 40) message = "Tu as encore beaucoup à apprendre des Anciens.";

    return (
      <div className="container mx-auto px-4 py-12 lg:py-16 max-w-2xl">
        <div className="metal-card p-6 lg:p-8 text-center border-2 border-metal-fire animate-fade-in">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="font-metal text-2xl lg:text-4xl text-metal-fire mb-8">Épreuve Terminée !</h1>
          <p className="text-metal-bone font-serif text-base lg:text-lg mb-8 italic">"{message}"</p>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-metal-black/50 rounded-lg border border-metal-gray">
              <div className="text-3xl font-bold text-metal-fire">{results.correctCount}/{results.totalCount}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Bonnes réponses</div>
            </div>
            <div className="p-4 bg-metal-black/50 rounded-lg border border-metal-gray">
              <div className="text-3xl font-bold text-yellow-400">{percentage}%</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Précision</div>
            </div>
            <div className="p-4 bg-metal-black/50 rounded-lg border border-metal-gray">
              <div className="text-3xl font-bold text-green-400">+{results.totalXp}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">XP Gagnée</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReplay}
              className="px-8 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20"
            >
              Relever le défi
            </button>
            <Link
              href="/profile"
              className="px-8 py-3 bg-metal-gray text-white font-bold rounded-lg hover:bg-metal-gray/80 transition-all border border-metal-gray"
            >
              Voir mon Profil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // ÉCRAN DE JEU
  // ─────────────────────────────────────────────────────
  if (isPlaying) {
    return (
      <div className="container mx-auto px-4 py-12 lg:py-16 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-metal text-2xl lg:text-4xl text-metal-fire">⚔️ Épreuve des Anciens</h1>
          <button
            onClick={() => setIsPlaying(false)}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Annuler
          </button>
        </div>
        <QuizGame pillar={selectedPillar === 'all' ? undefined : selectedPillar} onComplete={handleComplete} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // ÉCRAN DE SÉLECTION
  // ─────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-12 lg:py-16 max-w-4xl space-y-12">
      <div className="text-center space-y-4">
        <h1 className="font-metal text-2xl lg:text-4xl text-metal-fire">⚔️ Épreuve des Anciens</h1>
        <p className="text-metal-bone font-serif text-base lg:text-lg max-w-2xl mx-auto">
          Teste tes connaissances sur les groupes du Metalverse. Chaque bonne réponse te rapporte de l'XP.
          {userClass && (
            <span className="block mt-2 text-metal-fire font-semibold">
              ✨ Bonus actif : En tant que {userClass.name}, tu gagnes plus d'XP sur les quiz !
            </span>
          )}
        </p>
      </div>

      <div className="metal-card p-6 lg:p-8 border-2 border-metal-gray">
        <h2 className="font-metal text-xl lg:text-3xl text-metal-fire mb-4 text-center">Choisis ton domaine d'épreuve</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setSelectedPillar('all')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedPillar === 'all'
                ? 'border-metal-fire bg-metal-fire/10'
                : 'border-metal-gray bg-metal-black/50 hover:border-metal-fire/50'
            }`}
          >
            <div className="text-3xl mb-2">🌍</div>
            <div className="font-bold text-metal-bone">Tous les Piliers</div>
            <div className="text-xs text-gray-500 mt-1">Questions aléatoires sur tous les genres</div>
          </button>

          {GAMIFICATION_PILLARS.map((pillar) => {
            const classMeta = getClassMetadata(pillar as any);
            return (
              <button
                key={pillar}
                onClick={() => setSelectedPillar(pillar as GamificationPillar)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedPillar === pillar
                    ? 'border-metal-fire bg-metal-fire/10'
                    : 'border-metal-gray bg-metal-black/50 hover:border-metal-fire/50'
                }`}
              >
                <div className="text-3xl mb-2">{classMeta?.icon || '🎸'}</div>
                <div className="font-bold text-metal-bone">{pillar}</div>
                <div className="text-xs text-gray-500 mt-1">Spécialisé dans ce pilier</div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-metal-fire text-white font-bold text-lg rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 flex items-center gap-3 mx-auto"
          >
            <span>Commencer l'Épreuve</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
