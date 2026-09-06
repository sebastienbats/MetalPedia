'use client';

import { useState, useEffect } from 'react';
import { metalServerApi, type QuizQuestion } from '@/lib/metal-api';
import { useGamificationStore } from '@/stores/gamificationStore';
import { GAMIFICATION_PILLARS, type GamificationPillar } from '@/types/api';
import { getClassMetadata } from '@/lib/gamification/classes';

interface Props {
  trial: {
    type: 'passage';
    level: number;
    pillar: GamificationPillar;
  };
}

export default function TrialModal({ trial }: Props) {
  const completeTrial = useGamificationStore((s) => s.completeTrial);
  const dismissTrial = useGamificationStore((s) => s.dismissTrial);

  const [questions, setQuestions] = useState<(QuizQuestion & { options: string[] })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const classMeta = getClassMetadata(trial.pillar as any);
  const totalQuestions = 5;

  useEffect(() => {
    const fetchQuestions = async () => {
      const data = await metalServerApi.getQuizQuestions(trial.pillar, totalQuestions);
      const formatted = data.map((q: QuizQuestion) => {
        const uniqueOptions = Array.from(new Set([q.correct_answer, ...q.wrong_answers]));
        return {
          ...q,
          options: uniqueOptions.sort(() => Math.random() - 0.5),
        };
      }).filter(q => q.options.length >= 2);
      
      setQuestions(formatted);
      setIsLoading(false);
    };
    fetchQuestions();
  }, [trial.pillar]);

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    if (answer === currentQ.correct_answer) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinish = () => {
    const successRate = correctCount / Math.max(questions.length, 1);
    completeTrial(successRate >= 0.6); // 60% pour réussir
  };

  // ─────────────────────────────────────────────────────
  // ÉCRAN FINAL
  // ─────────────────────────────────────────────────────
  if (isFinished) {
    const successRate = correctCount / Math.max(questions.length, 1);
    const success = successRate >= 0.6;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
        <div className="metal-card w-full max-w-2xl p-8 border-2 border-metal-fire text-center">
          <div className="text-7xl mb-4">{success ? '🏆' : '📜'}</div>
          <h2 className="font-metal text-3xl text-metal-rust mb-4">
            {success ? 'Épreuve Réussie !' : 'Épreuve Inachevée'}
          </h2>
          
          <div className="mb-6">
            <div className="text-4xl font-bold mb-2" style={{ color: success ? '#22c55e' : '#f59e0b' }}>
              {correctCount} / {questions.length}
            </div>
            <div className="text-gray-400 text-sm uppercase tracking-wider">
              Bonnes réponses
            </div>
          </div>

          <div className="metal-card p-4 bg-metal-black/50 border border-metal-gray mb-6 italic text-gray-300">
            {success ? (
              <>
                <p className="mb-2">🔥 « Les Anciens reconnaissent ta valeur, Métalleux ! »</p>
                <p className="text-sm text-metal-fire font-semibold">
                  ✨ Bonus : Tes 10 prochaines actions rapporteront le double d'XP !
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">📜 « Les Anciens estiment que tu dois encore approfondir ton Savoir... »</p>
                <p className="text-sm text-gray-400">
                  Continue ton exploration, le Conseil t'observera à nouveau.
                </p>
              </>
            )}
          </div>

          <button
            onClick={handleFinish}
            className="px-8 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20"
          >
            Continuer l'Aventure
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // ÉCRAN DE CHARGEMENT
  // ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="metal-card p-12 text-center border-2 border-metal-fire">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <h2 className="font-metal text-2xl text-metal-rust mb-2">
            Épreuve de Passage - Niveau {trial.level}
          </h2>
          <p className="text-gray-400">Le Conseil des Neuf Genres prépare ton épreuve...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="metal-card p-8 text-center border-2 border-metal-fire">
          <p className="text-gray-400 mb-4">Aucune question disponible pour ce pilier.</p>
          <button
            onClick={dismissTrial}
            className="px-6 py-2 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // ─────────────────────────────────────────────────────
  // INTERFACE DU JEU
  // ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="metal-card w-full max-w-2xl p-6 md:p-8 border-2 border-metal-fire my-8">
        {/* En-tête de l'épreuve */}
        <div className="text-center mb-6 pb-4 border-b border-metal-gray">
          <div className="text-4xl mb-2">{classMeta?.icon || '⚔️'}</div>
          <h2 className="font-metal text-2xl text-metal-rust mb-1">
            Épreuve de Passage - Niveau {trial.level}
          </h2>
          <p className="text-sm text-gray-400">
            Domaine : <span style={{ color: classMeta?.color }}>{trial.pillar}</span>
          </p>
          <p className="text-xs text-gray-500 italic mt-2">
            « Les Anciens t'observent. Prouve ta valeur ! »
          </p>
        </div>

        {/* Progression */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <span className="text-gray-400">
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-metal-fire font-bold">
            Score : {correctCount}
          </span>
        </div>

        <div className="w-full h-2 bg-metal-gray rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-metal-fire rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <h3 className="font-serif text-xl text-gray-100 mb-6 text-center min-h-[60px] flex items-center justify-center">
          {currentQ.question_text}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQ.options.map((option, idx) => {
            let buttonClass = "w-full p-3 text-left rounded-lg border-2 transition-all font-medium flex items-center gap-3 ";
            
            if (isAnswered) {
              if (option === currentQ.correct_answer) {
                buttonClass += "bg-green-900/30 border-green-500 text-green-400";
              } else if (option === selectedAnswer) {
                buttonClass += "bg-red-900/30 border-red-500 text-red-400";
              } else {
                buttonClass += "bg-metal-black/50 border-metal-gray text-gray-500 opacity-50";
              }
            } else {
              buttonClass += "bg-metal-black/50 border-metal-gray text-gray-200 hover:border-metal-fire hover:bg-metal-fire/10 cursor-pointer";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                className={buttonClass}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-metal-gray text-sm font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div className="pt-4 border-t border-metal-gray flex flex-col items-center animate-fade-in">
            <p className={`text-base font-bold mb-4 ${selectedAnswer === currentQ.correct_answer ? 'text-green-400' : 'text-red-400'}`}>
              {selectedAnswer === currentQ.correct_answer 
                ? '✅ Bonne réponse !' 
                : `❌ La bonne réponse était : ${currentQ.correct_answer}`}
            </p>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all"
            >
              {currentIndex < questions.length - 1 ? 'Question Suivante →' : 'Voir le Verdict'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
