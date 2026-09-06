'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { metalServerApi, type QuizQuestion } from '@/lib/metal-api';
import { useGamificationStore } from '@/stores/gamificationStore';

interface Props {
  pillar?: string;
  onComplete: (totalXp: number, correctCount: number, totalCount: number) => void;
}

export default function QuizGame({ pillar, onComplete }: Props) {
  const { data: user } = useAuth();
  const recordQuiz = useGamificationStore((s) => s.recordQuiz);

  const [questions, setQuestions] = useState<(QuizQuestion & { options: string[] })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      const data = await metalServerApi.getQuizQuestions(pillar, 5); // 5 questions par session
      
      const formatted = data.map((q: QuizQuestion) => {
        // 🛡️ FILET DE SÉCURITÉ : Utiliser un Set pour garantir l'unicité absolue des options
        // Cela élimine tout doublon résiduel provenant de la base de données
        const uniqueOptions = Array.from(new Set([q.correct_answer, ...q.wrong_answers]));
        
        return {
          ...q,
          // Mélange aléatoire des options uniques
          options: uniqueOptions.sort(() => Math.random() - 0.5),
        };
      }).filter(q => q.options.length >= 2); // Sécurité : on écarte toute question corrompue avec < 2 options
      
      setQuestions(formatted);
      setIsLoading(false);
    };
    fetchQuestions();
  }, [pillar]);

  const handleAnswer = async (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = answer === currentQ.correct_answer;
    
    const baseXp = 20; // XP de base par bonne réponse
    let earnedXp = 0;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      // Le store calcule l'XP finale avec le bonus de classe et retourne cette valeur
      earnedXp = recordQuiz(true, baseXp);
      setTotalXpEarned((prev) => prev + earnedXp);
    } else {
      recordQuiz(false, baseXp); // 0 XP, mais on appelle pour la cohérence
    }

    // Enregistrement en base (seulement si connecté)
    if (user && currentQ) {
      try {
        await metalServerApi.submitQuizAttempt(
          user.id,
          currentQ.id,
          answer,
          isCorrect,
          earnedXp
        );
      } catch (err) {
        console.error("Erreur sauvegarde tentative quiz:", err);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      onComplete(totalXpEarned, correctCount, questions.length);
    }
  };

  // ─────────────────────────────────────────────────────
  // ÉTAT DE CHARGEMENT
  // ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="metal-card p-12 text-center border-2 border-metal-gray">
        <div className="text-5xl mb-4 animate-pulse">🧠</div>
        <p className="text-gray-400 text-lg">Le Conseil des Neuf Genres prépare tes épreuves...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // AUCUNE QUESTION DISPONIBLE
  // ─────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="metal-card p-12 text-center border-2 border-metal-gray">
        <div className="text-5xl mb-4">📜</div>
        <p className="text-gray-400 text-lg mb-4">
          Aucune question disponible pour le moment dans cette catégorie.
        </p>
        <p className="text-sm text-gray-500">
          Essaie de sélectionner "Tous les Piliers" ou reviens plus tard !
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // ─────────────────────────────────────────────────────
  // INTERFACE DU JEU
  // ─────────────────────────────────────────────────────
  return (
    <div className="metal-card p-6 md:p-8 border-2 border-metal-gray max-w-2xl mx-auto animate-fade-in">
      {/* Header du Quiz */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <span className="text-sm font-bold text-metal-fire">
          Score: {correctCount}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-2 bg-metal-gray rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-metal-fire rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="font-serif text-xl md:text-2xl text-gray-100 mb-8 text-center leading-relaxed min-h-[80px] flex items-center justify-center">
        {currentQ.question_text}
      </h3>

      {/* Options de réponse */}
      <div className="space-y-3">
        {currentQ.options.map((option, idx) => {
          let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all font-medium flex items-center gap-3 ";
          
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

      {/* Feedback et bouton Suivant */}
      {isAnswered && (
        <div className="mt-8 pt-6 border-t border-metal-gray flex flex-col items-center animate-fade-in">
          <p className={`text-lg font-bold mb-4 flex items-center gap-2 ${selectedAnswer === currentQ.correct_answer ? 'text-green-400' : 'text-red-400'}`}>
            {selectedAnswer === currentQ.correct_answer ? (
              <>✅ Bonne réponse ! Savoir ancestral acquis.</>
            ) : (
              <>❌ Mauvaise réponse. La bonne réponse était : <span className="text-green-400">{currentQ.correct_answer}</span></>
            )}
          </p>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 flex items-center gap-2"
          >
            {currentIndex < questions.length - 1 ? 'Question Suivante' : 'Voir les Résultats'}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
