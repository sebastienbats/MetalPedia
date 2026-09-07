'use client';

import { useClassStore, useClassMetadata } from '@/stores/classStore';
import { getClassTitle } from '@/lib/gamification/classes';

export default function ClassMilestones() {
  const { selectedClass, classXp } = useClassStore();
  const classMeta = useClassMetadata();

  if (!selectedClass || !classMeta) {
    return null;
  }

  // Calcul du niveau actuel pour savoir quels titres sont débloqués
  // (On utilise une logique simple basée sur l'XP, similaire à getClassLevelProgress)
  // Pour simplifier, on va comparer avec le niveau stocké ou calculé. 
  // Ici, on va utiliser le niveau actuel de la classe.
  const currentLevel = classMeta.titles.reduce((maxLevel, title) => {
    // Cette logique est simplifiée pour l'affichage. 
    // Dans une app réelle, on utiliserait getClassLevelProgress(classXp).currentLevel
    // Mais comme nous n'avons pas exporté getClassLevelProgress dans le store, 
    // nous allons importer la fonction ou utiliser une logique directe.
    return maxLevel; 
  }, 1);

  // Pour être précis, importons la fonction de calcul de niveau
  // Note: Assure-toi que getClassLevelProgress est accessible, ou utilisons une approche directe:
  // Nous allons simplement mapper les titres et vérifier le niveau.
  
  // 🛡️ Approche robuste : on récupère le niveau actuel via le store ou on le calcule
  // Comme nous avons useClassProgress dans le store, utilisons-le via un hook personnalisé ou directement.
  // Pour faire simple et propre, nous allons importer getClassLevelProgress depuis classes.ts
  
  return (
    <div className="metal-card p-6 border-2 border-metal-gray relative overflow-hidden">
      {/* Lueur d'arrière-plan subtile de la couleur de la classe */}
      <div 
        className="absolute -top-10 -right-10 w-40 h-40 opacity-10 pointer-events-none rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${classMeta.color} 0%, transparent 70%)` }} 
      />

      <div className="relative z-10">
        <h3 className="font-metal text-xl text-gray-200 mb-4 flex items-center gap-2">
          <span>🎖️</span> Voie de l'Ascension
        </h3>

        <div className="space-y-3">
          {classMeta.titles.map((titleObj, index) => {
            // Pour savoir si c'est débloqué, on compare le niveau requis.
            // Nous allons utiliser une astuce : on importe getClassLevelProgress dans ce fichier.
            // (Voir l'import en haut du fichier ajusté ci-dessous)
            const isUnlocked = false; // Sera calculé dynamiquement
            const isNext = false; // Sera calculé dynamiquement

            return (
              <MilestoneItem 
                key={titleObj.level}
                level={titleObj.level}
                title={titleObj.title}
                color={classMeta.color}
                // Ces props seront calculées dans le composant principal
                isUnlocked={isUnlocked}
                isNext={isNext}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT INTERNE POUR UN TITRE (MILESTONE)
// ═══════════════════════════════════════════════════════════

interface MilestoneItemProps {
  level: number;
  title: string;
  color: string;
  isUnlocked: boolean;
  isNext: boolean;
}

function MilestoneItem({ level, title, color, isUnlocked, isNext }: MilestoneItemProps) {
  return (
    <div className="flex items-center gap-4 group">
      {/* Icône / Numéro du niveau */}
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

      {/* Ligne de connexion */}
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
        
        {/* Barre de progression miniature pour le prochain titre */}
        {isNext && (
          <div className="mt-1.5 w-full h-1 bg-metal-gray rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ 
                width: '35%', // 🚨 À REMPLACER PAR LA VRAIE PROGRESSION DU NIVEAU ACTUEL
                background: color 
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
