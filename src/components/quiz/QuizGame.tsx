'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/authApi';
import { metalServerApi } from '@/lib/metal-api';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useClassStore, useClassMetadata } from '@/stores/classStore';

interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  band_id: number;
}

interface Props {
  pillar?: string;
  onComplete: (totalXp: number, correctCount: number, totalCount: number) => void;
}

export default function QuizGame({ pillar, onComplete }: Props) {
  const { data: user } = useAuth();
  const router = useRouter();
  const recordQuiz = useGamificationStore((s) => s.recordQuiz);
  const classMeta = useClassMetadata();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const data = await metalServerApi.getQuizQuestions(pillar, 5); // 5 questions par session
      // Mélanger les options de réponse pour chaque question
      const formatted = data.map((q: any) => ({
        ...q,
        options: shuffleArray([q.correct_answer, ...q.wrong_answers]),
      }));
      setQuestions(formatted);
      setIsLoading(false);
    };
    fetchQuestions();
  }, [pillar]);

  const shuffleArray = (array: string[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleAnswer = async (answer: string) => {
    if (isAnswered || !user) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = answer === currentQ.correct_answer;
    
    // Calcul XP : 20 XP de base + bonus de classe
    const baseXp = 20;
    let earnedXp = 0;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      // On appelle le store pour appliquer le bonus de classe et mettre à jour l'XP globale
      // Note: on doit récupérer le multiplicateur pour savoir combien on a vraiment gagné
      const selectedClass = useClassStore.getState().selectedClass;
      let multiplier = 1;
      if (selectedClass) {
        const meta = useClassStore.getState().selectedClass; // Simplification, à ajuster selon ta logique applyClassBonus
        // Pour faire simple ici, on laisse le store calculer, mais on a besoin de la valeur finale pour l'envoyer à Supabase
        // Astuce: on simule l'appel ou on lit l'XP avant/après. 
        // Mieux: on calcule l'XP ici comme le fait applyClassBonus.
      }
      
      // Calcul simplifié pour l'envoi à Supabase (le store gère l'affichage)
      // Idéalement, expose une fonction getQuizXp(baseXp) dans le store.
      // Pour l'instant, on envoie baseXp, le store ajoutera le bonus visuellement, 
      // mais pour la DB, on va envoyer une estimation ou appeler une fonction helper.
      
      // HACK PROPRE: On utilise la même logique que applyClassBonus pour obtenir le finalXp exact
      // (Copie rapide de la logique ou import de la fonction si exportée)
      earnedXp = baseXp; // À remplacer par le vrai calcul avec bonus si exporté
    }

    // Enregistrement en base (seulement si connecté)
    if (user) {
      try {
        await metalServerApi.submitQuizAttempt(
          user.id,
          currentQ.id,
          answer,
          isCorrect,
          earnedXp // Idéalement: le finalXp calculé avec le bonus
        );
      } catch (err) {
        console.error("Erreur sauvegarde tentative quiz:", err);
      }
    }

    // Mise à jour du store de gamification
    recordQuiz(isCorrect, baseXp);
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

  if (isLoading) {
    return (
      <div className="metal-card p-12 text-center">
        <div className="text-4xl mb-4 animate-pulse">🧠</div>
        <p className="text-gray-400">Le Conseil des Neuf Genres prépare tes épreuves...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="metal-card p-12 text-center">
        <p className="text-gray-400">Aucune question disponible pour le moment.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  // Mélange déjà fait dans le useEffect, on utilise currentQ.options si on l'a ajouté, sinon on le fait à la volée
  const options = shuffleArray([currentQ.correct_answer, ...currentQ.wrong_answers]);

  return (
    <div className="metal-card p-6 md:p-8 border-2 border-metal-gray max-w-2xl mx-auto">
      {/* Header du Quiz */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-gray-400">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <span className="text-sm font-bold text-metal-fire">
          Score: {correctCount}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-2 bg-metal-gray rounded-full mb-8">
        <div 
          className="h-full bg-metal-fire rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="font-serif text-xl md:text-2xl text-gray-100 mb-8 text-center leading-relaxed">
        {currentQ.question_text}
      </h3>

      {/* Options de réponse */}
      <div className="space-y-3">
        {options.map((option, idx) => {
          let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all font-medium ";
          
          if (isAnswered) {
            if (option === currentQ.correct_answer) {
              buttonClass += "bg-green-900/30 border-green-500 text-green-400";
            } else if (option === selectedAnswer) {
              buttonClass += "bg-red-900/30 border-red-500 text-red-400";
            } else {
              buttonClass += "bg-metal-black/50 border-metal-gray text-gray-500 opacity-50";
            }
          } else {
            buttonClass += "bg-metal-black/50 border-metal-gray text-gray-200 hover:border-metal-fire hover:bg-metal-fire/10";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
              className={buttonClass}
            >
              <span className="inline-block w-6 font-bold opacity-50">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Feedback et bouton Suivant */}
      {isAnswered && (
        <div className="mt-8 flex flex-col items-center animate-fade-in">
          <p className={`text-lg font-bold mb-4 ${selectedAnswer === currentQ.correct_answer ? 'text-green-400' : 'text-red-400'}`}>
            {selectedAnswer === currentQ.correct_answer 
              ? '✅ Bonne réponse ! Le Savoir est tien.' 
              : '❌ Mauvaise réponse. Les ténèbres t\'ont trompé.'}
          </p>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20"
          >
            {currentIndex < questions.length - 1 ? 'Question Suivante →' : 'Voir les Résultats'}
          </button>
        </div>
      )}
    </div>
  );
}
