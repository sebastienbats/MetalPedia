'use client';

import { useState, useEffect } from 'react';
import { metalServerApi, type QuizQuestion } from '@/lib/metal-api';
import { getClassMetadata } from '@/lib/gamification/classes';
import { useGamificationStore } from '@/stores/gamificationStore';
import type { CharacterClass } from '@/types/api';

interface Props {
  targetClass: CharacterClass;
  onSuccess: () => void;
  onFail: () => void;
  onBack: () => void;
}

export default function ClassInitiationQuiz({ targetClass, onSuccess, onFail, onBack }: Props) {
  const recordQuiz = useGamificationStore((s) => s.recordQuiz);
  const classMeta = getClassMetadata(targetClass);
  
  const [questions, setQuestions] = useState<(QuizQuestion & { options: string[] })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      const data = await metalServerApi.getQuizQuestions(classMeta.pillar, 3);
      if (!data || data.length === 0) {
        setIsUnavailable(true);
        setIsLoading(false);
        return;
      }
      const formatted = data.map((q: QuizQuestion) => {
        const uniqueOptions = Array.from(new Set([q.correct_answer, ...q.wrong_answers]));
        return { ...q, options: uniqueOptions.sort(() => Math.random() - 0.5) };
      });
      setQuestions(formatted);
      setIsLoading(false);
    };
    fetchQuestions();
  }, [classMeta.pillar]);

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === questions[currentIndex].correct_answer) {
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

  const handleFinalize = () => {
    if (correctCount >= 2) {
      recordQuiz(true, 50); 
      onSuccess();
    } else {
      onFail();
    }
  };

  if (isUnavailable) {
    return (
      <div className="text-center py-8 space-y-6 animate-fade-in">
        <div className="text-6xl">📜</div>
        <h3 className="font-metal text-2xl text-yellow-500">Archives Incomplètes</h3>
        <p className="text-sm text-gray-400 italic max-w-md mx-auto leading-relaxed">
          « Les Tables du Savoir concernant la voie du <strong className="text-gray-200">{classMeta.name}</strong> sont encore fragmentées. 
          <br /><br />Reviens lorsque les Archives auront été restaurées. »
        </p>
        <button onClick={onBack} className="px-8 py-3 bg-metal-gray text-gray-300 font-bold rounded-lg hover:bg-metal-gray/80 transition-all">
          Revenir à la sélection
        </button>
      </div>
    );
  }

  if (isFinished) {
    const success = correctCount >= 2;
    return (
      <div className="text-center space-y-6 animate-fade-in py-4">
        <div className="text-6xl">{success ? '⚔️' : '📜'}</div>
        <h3 className={`font-metal text-3xl ${success ? 'text-green-400' : 'text-red-400'}`}>
          {success ? 'Adoubement Réussi !' : 'Adoubement Refusé'}
        </h3>
        <div className="metal-card p-4 bg-metal-black/50 border border-metal-gray inline-block">
          <p className="text-2xl font-bold text-gray-200 mb-1">{correctCount} / {questions.length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Bonnes réponses</p>
        </div>
        <p className="text-sm text-gray-400 italic max-w-md mx-auto leading-relaxed">
          {success 
            ? `"Les Anciens reconnaissent ta valeur. Tu es désormais digne de porter le titre de ${classMeta.name}. Que ton voyage commence."`
            : `"Les Anciens estiment que ton esprit n'est pas encore assez aiguisé pour la voie du ${classMeta.name}. Explore davantage ce pilier et reviens quand tu seras prêt."`}
        </p>
        <button
          onClick={handleFinalize}
          className={`w-full sm:w-auto px-8 py-3 font-bold rounded-lg transition-all shadow-lg ${
            success ? 'bg-metal-fire text-white hover:bg-metal-fire/80 shadow-metal-fire/20' : 'bg-metal-gray text-gray-300 hover:bg-metal-gray/80'
          }`}
        >
          {success ? 'Accepter mon Destin' : 'Revenir à la sélection'}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 animate-pulse">
        <div className="text-5xl mb-4">🧠</div>
        <p className="text-gray-400">Le Conseil prépare ton épreuve d'adoubement...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // 🚀 INTERFACE COMPACTE : Pas d'en-tête (géré par la modale), espacement réduit
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barre de progression compacte */}
      <div className="bg-metal-black/30 p-3 rounded-lg border border-metal-gray/50">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span className="text-metal-fire font-bold">Score: {correctCount}</span>
        </div>
        <div className="w-full h-1.5 bg-metal-gray rounded-full overflow-hidden">
          <div 
            className="h-full bg-metal-fire rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h4 className="font-serif text-base md:text-lg text-gray-100 text-center leading-snug px-2">
        {currentQ.question_text}
      </h4>

      {/* Options (espacement réduit pour éviter le scroll) */}
      <div className="space-y-2">
        {currentQ.options.map((option, idx) => {
          let buttonClass = "w-full p-3 text-left rounded-lg border-2 transition-all font-medium flex items-center gap-3 ";
          if (isAnswered) {
            if (option === currentQ.correct_answer) buttonClass += "bg-green-900/30 border-green-500 text-green-400";
            else if (option === selectedAnswer) buttonClass += "bg-red-900/30 border-red-500 text-red-400";
            else buttonClass += "bg-metal-black/50 border-metal-gray text-gray-500 opacity-50";
          } else {
            buttonClass += "bg-metal-black/50 border-metal-gray text-gray-200 hover:border-metal-fire hover:bg-metal-fire/10 cursor-pointer active:scale-[0.98]";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
              className={buttonClass}
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-metal-gray text-sm font-bold shrink-0 text-gray-800">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-sm md:text-base leading-tight">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback et Bouton Suivant (Immédiatement sous les options, pas de scroll nécessaire) */}
      {isAnswered && (
        <div className="pt-4 mt-4 border-t border-metal-gray flex flex-col items-center animate-fade-in">
          <p className={`text-sm font-bold mb-4 text-center ${selectedAnswer === currentQ.correct_answer ? 'text-green-400' : 'text-red-400'}`}>
            {selectedAnswer === currentQ.correct_answer ? '✅ Bonne réponse !' : `❌ La bonne réponse était : ${currentQ.correct_answer}`}
          </p>
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-8 py-3 bg-metal-fire text-white text-sm md:text-base font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 active:scale-95"
          >
            {currentIndex < questions.length - 1 ? 'Question Suivante →' : 'Voir le Verdict du Conseil'}
          </button>
        </div>
      )}
    </div>
  );
}
