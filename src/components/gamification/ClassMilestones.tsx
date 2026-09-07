'use client';

import { useClassStore, useClassMetadata, useClassProgress } from '@/stores/classStore';

export default function ClassMilestones() {
  const { selectedClass } = useClassStore();
  const classMeta = useClassMetadata();
  const classProgress = useClassProgress();

  if (!selectedClass || !classMeta || !classProgress) {
    return null;
  }

  const currentLevel = classProgress.currentLevel;

  return (
    <div className="metal-card p-6 border-2 border-metal-gray relative overflow-hidden">
      <div 
        className="absolute -top-10 -right-10 w-40 h-40 opacity-10 pointer-events-none rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${classMeta.color} 0%, transparent 70%)` }} 
      />

      <div className="relative z-10">
        <h3 className="font-metal text-xl text-gray-200 mb-4 flex items-center gap-2">
          <span>🎖️</span> Voie de l'Ascension
        </h3>

        <div className="space-y-4">
          {classMeta.titles.map((titleObj) => {
            const isUnlocked = currentLevel >= titleObj.level;
            // Le "prochain" est le premier titre qui n'est pas encore débloqué
            const allUnlockedSoFar = classMeta.titles.filter(t => currentLevel >= t.level);
            const nextTitleLevel = classMeta.titles[allUnlockedSoFar.length]?.level || 999;
            const isNext = titleObj.level === nextTitleLevel;

            return (
              <MilestoneItem 
                key={titleObj.level}
                level={titleObj.level}
                title={titleObj.title}
                color={classMeta.color}
                isUnlocked={isUnlocked}
                isNext={isNext}
                currentLevel={currentLevel}
                totalLevelsForThisTitle={titleObj.level} // Simplifié pour l'exemple
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MilestoneItemProps {
  level: number;
  title: string;
  color: string;
  isUnlocked: boolean;
  isNext: boolean;
  currentLevel: number;
  totalLevelsForThisTitle: number;
}

function MilestoneItem({ level, title, color, isUnlocked, isNext, currentLevel }: MilestoneItemProps) {
  // Calcul approximatif de la progression vers ce niveau spécifique pour la barre
  // (Niveau actuel - Niveau précédent) / (Niveau cible - Niveau précédent)
  const prevLevel = level - 10 > 0 ? level - 10 : 1;
  const progress = isNext ? Math.min(100, ((currentLevel - prevLevel) / (level - prevLevel)) * 100) : (isUnlocked ? 100 : 0);

  return (
    <div className="flex items-center gap-4 group">
      <div 
        className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 transition-all duration-500
          ${isUnlocked 
            ? 'bg-metal-fire/20 border-metal-fire text-metal-fire shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
            : isNext 
              ? 'bg-metal-gray/30 border-gray-400 text-gray-300 animate-pulse' 
              : 'bg-metal-black border-metal-gray/50 text-gray-600'}
        `}
      >
        {isUnlocked ? '🏆' : level}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span 
            className={`font-semibold transition-colors duration-500 ${
              isUnlocked ? 'text-gray-100' : isNext ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {title}
          </span>
          <span className="text-xs text-gray-500 font-mono">Niv. {level}</span>
        </div>
        
        {isNext && (
          <div className="mt-1.5 w-full h-1.5 bg-metal-gray rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
