'use client';

import { useState } from 'react';
import Link from 'next/link';
import QuizGame from '@/components/quiz/QuizGame';
import { GAMIFICATION_PILLARS, type GamificationPillar, PILLAR_METADATA } from '@/types/api';
import { useClassMetadata } from '@/stores/classStore';

export default function QuizPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<GamificationPillar | 'all'>('all');
  const [results, setResults] = useState<{ totalXp: number; correctCount: number; totalCount: number } | null>(null);

  const userClass = useClassMetadata();

  // ✅ Lancement immédiat au clic sur une carte
  const handleStart = (pillar: GamificationPillar | 'all') => {
    setSelectedPillar(pillar);
    setIsPlaying(true);
    setResults(null);
    // Scroll en haut de page pour le confort sur mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = (totalXp: number, correctCount: number, totalCount: number) => {
    setResults({ totalXp, correctCount, totalCount });
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setResults(null);
    setIsPlaying(false); // Retourne à l'écran de sélection
  };

  // ═══════════════════════════════════════════════════════════
  // ÉCRAN DE RÉSULTATS
  // ═══════════════════════════════════════════════════════════
  if (results) {
    const percentage = Math.round((results.correctCount / results.totalCount) * 100);
    let message = "Les ténèbres t'ont trompé...";
    if (percentage >= 80) message = "Tu es un véritable érudit du Metalverse !";
    else if (percentage >= 60) message = "Tu connais bien tes classiques, Métalleux.";
    else if (percentage >= 40) message = "Tu as encore beaucoup à apprendre des Anciens.";

    return (
      <div className="w-full px-2 py-6 sm:px-4 sm:py-12 sm:max-w-2xl sm:mx-auto">
        <div className="metal-card p-4 sm:p-8 md:p-12 text-center border-2 border-metal-fire animate-fade-in">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🏆</div>
          <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2">Épreuve Terminée !</h1>
          <p className="text-metal-bone font-serif text-sm sm:text-lg mb-6 sm:mb-8 italic">"{message}"</p>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="p-2 sm:p-4 bg-metal-black/50 rounded-lg border border-metal-gray">
              <div className="text-xl sm:text-3xl font-bold text-metal-fire">{results.correctCount}/{results.totalCount}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1">Bonnes réponses</div>
            </div>
            <div className="p-2 sm:p-4 bg-metal-black/50 rounded-lg border border-metal-gray">
              <div className="text-xl sm:text-3xl font-bold text-yellow-400">{percentage}%</div>
              <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1">Précision</div>
            </div>
            <div className="p-2 sm:p-4 bg-metal-black/50 rounded-lg border border-metal-gray">
              <div className="text-xl sm:text-3xl font-bold text-green-400">+{results.totalXp}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1">XP Gagnée</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleReplay}
              className="px-6 sm:px-8 py-2 sm:py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 text-sm sm:text-base"
            >
              Nouvelle épreuve
            </button>
            <Link
              href="/profile"
              className="px-6 sm:px-8 py-2 sm:py-3 bg-metal-gray text-white font-bold rounded-lg hover:bg-metal-gray/80 transition-all border border-metal-gray text-sm sm:text-base"
            >
              Voir mon Profil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ÉCRAN DU JEU (QuizGame)
  // ═══════════════════════════════════════════════════════════
  if (isPlaying) {
    return (
      <div className="w-full px-2 py-6 sm:px-4 sm:py-12 sm:max-w-3xl sm:mx-auto">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <h1 className="font-metal text-xl sm:text-3xl text-metal-fire flex items-center gap-2">
            ⚔️ {selectedPillar === 'all' ? 'Épreuve Globale' : selectedPillar}
          </h1>
          <button
            onClick={handleReplay}
            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-metal-gray/30"
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

  // ═══════════════════════════════════════════════════════════
  // ÉCRAN DE SÉLECTION (Grille interactive des piliers)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12 sm:max-w-5xl sm:mx-auto space-y-6 sm:space-y-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire">⚔️ Épreuve des Anciens</h1>
        <p className="text-metal-bone font-serif text-sm sm:text-lg max-w-2xl mx-auto">
          Choisis ton domaine d'épreuve. Un simple clic suffit pour commencer.
          {userClass && (
            <span className="block mt-3 text-metal-fire font-semibold text-xs sm:text-base bg-metal-fire/10 px-3 py-1.5 rounded-full border border-metal-fire/30 inline-block">
              ✨ Bonus actif : En tant que {userClass.name}, tu gagnes plus d'XP sur les quiz !
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* 🌍 Carte "Tous les piliers" */}
        <button
          onClick={() => handleStart('all')}
          className="group relative p-4 sm:p-6 rounded-xl border-2 border-metal-fire/50 bg-metal-fire/5 hover:bg-metal-fire/10 hover:border-metal-fire transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-metal-fire/20 text-left"
        >
          <div className="text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🌍</div>
          <h3 className="font-metal text-xl sm:text-2xl text-metal-fire mb-2">Tous les Piliers</h3>
          <p className="text-xs sm:text-sm text-gray-400">Questions aléatoires sur l'ensemble du Metalverse.</p>
        </button>

        {/* 🎸 Cartes des 9 piliers avec couleurs dynamiques */}
        {GAMIFICATION_PILLARS.map((pillar) => {
          const meta = PILLAR_METADATA[pillar];
          return (
            <button
              key={pillar}
              onClick={() => handleStart(pillar)}
              className="group relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] text-left"
              style={{
                backgroundColor: `${meta.color}15`,
                borderColor: `${meta.color}40`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = meta.color;
                (e.currentTarget as HTMLElement).style.backgroundColor = `${meta.color}25`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 25px -5px ${meta.color}50`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${meta.color}40`;
                (e.currentTarget as HTMLElement).style.backgroundColor = `${meta.color}15`;
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div 
                className="text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block"
                style={{ filter: `drop-shadow(0 0 8px ${meta.color})` }}
              >
                {meta.icon}
              </div>
              <h3 
                className="font-metal text-xl sm:text-2xl mb-2 transition-colors"
                style={{ color: meta.color }}
              >
                {pillar}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">
                {meta.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
