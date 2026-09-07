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
      {/* Lueur d'arrière-plan subtile de la couleur de la classe */}
      <div 
        className="absolute -top-10 -right-10 w-40 h-40 opacity-10 pointer-events-none rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${classMeta.color} 0%, transparent 70%)` }} 
      />

      <div className="relative z-10">
        {/* 🆕 EN-TÊTE EXPLICITE */}
        <div className="mb-6 pb-4 border-b border-metal-gray/50">
          <h3 className="font-metal text-2xl text-gray-100 mb-2 flex items-center gap-2">
            🎖️ Grades de Maîtrise
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Chaque fois que tu déclenches le <span className="text-metal-fire font-semibold">bonus de ta classe</span>, 
            tu gagnes de l'XP de maîtrise. Gravis les échelons pour débloquer des <strong className="text-gray-200">titres légendaires</strong>.
          </p>
        </div>

        {/* LISTE DES GRADES */}
        <div className="space-y-4">
          {classMeta.titles.map((titleObj, index) => {
            const isUnlocked = currentLevel >= titleObj.level;
            
            // Identifier le prochain grade à débloquer
            const allUnlockedSoFar = classMeta.titles.filter(t => currentLevel >= t.level);
            const nextTitleLevel = classMeta.titles[allUnlockedSoFar.length]?.level || 999;
            const isNext = titleObj.level === nextTitleLevel;
            
            // Calcul de la progression pour le grade en cours
            let progress = 0;
            if (isNext) {
              const prevLevel = index > 0 ? classMeta.titles[index - 1].level : 0;
              const totalLevelsToGain = titleObj.level - prevLevel;
              const levelsGained = currentLevel - prevLevel;
              progress = Math.min(100, Math.max(0, (levelsGained / totalLevelsToGain) * 100));
            } else if (isUnlocked) {
              progress = 100;
            }

            const state = isUnlocked ? 'unlocked' : isNext ? 'current' : 'locked';

            return (
              <MilestoneItem 
                key={titleObj.level}
                level={titleObj.level}
                title={titleObj.title}
                color={classMeta.color}
                state={state}
                progress={progress}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT INTERNE : UN GRADE (MILESTONE)
// ═══════════════════════════════════════════════════════════

interface MilestoneItemProps {
  level: number;
  title: string;
  color: string;
  state: 'unlocked' | 'current' | 'locked';
  progress: number;
}

function MilestoneItem({ level, title, color, state, progress }: MilestoneItemProps) {
  
  // Styles adaptés à l'état du grade (utilisation de styles en ligne pour les couleurs dynamiques)
  const styles = {
    unlocked: {
      icon: '🏆',
      iconStyle: { backgroundColor: `${color}20`, borderColor: color, color: color },
      titleColor: 'text-gray-100',
      badge: '✅ Obtenu',
      badgeStyle: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.5)', color: '#4ade80' },
    },
    current: {
      icon: '🎯',
      iconStyle: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', color: '#ef4444' },
      titleColor: 'text-gray-100',
      badge: `En cours (${Math.round(progress)}%)`,
      badgeStyle: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' },
    },
    locked: {
      icon: '🔒',
      iconStyle: { backgroundColor: 'rgba(75, 85, 99, 0.3)', borderColor: 'rgba(75, 85, 99, 1)', color: '#6b7280' },
      titleColor: 'text-gray-500',
      badge: `Verrouillé (Niv. ${level})`,
      badgeStyle: { backgroundColor: 'rgba(75, 85, 99, 0.2)', borderColor: 'rgba(75, 85, 99, 0.5)', color: '#6b7280' },
    }
  };

  const currentStyle = styles[state];

  return (
    <div 
      className={`
        flex items-start gap-4 p-4 rounded-lg border transition-all duration-300
        ${state === 'current' ? 'bg-metal-fire/5 border-metal-fire/30 shadow-md' : 'bg-metal-black/30 border-metal-gray/50'}
      `}
    >
      {/* Icône d'état */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 border-2"
        style={currentStyle.iconStyle}
      >
        {currentStyle.icon}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <h4 className={`font-bold text-lg transition-colors ${currentStyle.titleColor}`}>
              {title}
            </h4>
            <p className="text-xs text-gray-500 font-mono">
              Requis : Niveau de classe {level}
            </p>
          </div>
          
          {/* Badge d'état */}
          <span 
            className="px-2 py-1 text-[10px] font-bold rounded-full border whitespace-nowrap"
            style={currentStyle.badgeStyle}
          >
            {currentStyle.badge}
          </span>
        </div>

        {/* Barre de progression (visible uniquement pour le grade en cours) */}
        {state === 'current' && (
          <div className="mt-2">
            <div className="w-full h-2.5 bg-metal-gray rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                style={{ 
                  width: `${progress}%`, 
                  background: `linear-gradient(to right, ${color}, ${color}dd)` 
                }}
              >
                {/* Effet de brillance animé */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 text-right italic">
              Continue d'explorer les groupes qui correspondent à ta classe !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
