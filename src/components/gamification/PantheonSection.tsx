'use client';

import { useState } from 'react';
import { ALL_CLASSES, getClassMetadata, getClassTitle } from '@/lib/gamification/classes';
import { usePantheon, useSelectedClass } from '@/stores/classStore';

// ═══════════════════════════════════════════════════════════
// MODALE DE DÉTAIL DE LA CLASSE
// ═══════════════════════════════════════════════════════════
function ClassModal({ 
  classMeta, 
  maxLevel, 
  isActive, 
  onClose 
}: { 
  classMeta: ReturnType<typeof getClassMetadata>; 
  maxLevel: number; 
  isActive: boolean;
  onClose: () => void;
}) {
  const isMastered = maxLevel >= 50;
  const isExplored = maxLevel > 0;
  const title = isExplored ? getClassTitle(classMeta.id, maxLevel) : 'Non explorée';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md metal-card border-2 p-6 animate-slide-up"
        style={{ borderColor: isActive ? '#b33939' : (isMastered ? '#eab308' : classMeta.color) }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          {/* Icône en grand */}
          <div 
            className="text-7xl mb-3 inline-block"
            style={{ 
              filter: isExplored ? `drop-shadow(0 0 20px ${classMeta.color})` : 'grayscale(1) opacity(0.5)',
            }}
          >
            {classMeta.icon}
          </div>
          
          {/* Nom complet */}
          <h3 
            className="font-metal text-2xl mb-2 break-words leading-tight"
            style={{ color: isExplored ? classMeta.color : '#666' }}
          >
            {classMeta.name}
          </h3>
          
          {/* Badge du pilier */}
          <div 
            className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded inline-block"
            style={{ backgroundColor: `${classMeta.color}20`, color: classMeta.color, border: `1px solid ${classMeta.color}40` }}
            >
            {classMeta.pillar}
          </div>
        </div>

        <div className="space-y-4">
          {/* Statut et Titre */}
          {isExplored ? (
            <div className="text-center p-3 bg-metal-black/50 rounded border border-metal-gray/50">
              <div className="text-sm text-gray-300 font-semibold mb-1">
                Niveau atteint : <span style={{ color: classMeta.color }}>{maxLevel}</span> / 50
              </div>
              <div className="text-xs text-gray-400 italic">
                Titre actuel : « {title} »
              </div>
              {isMastered && (
                <div className="mt-2 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                  🏆 Voie Maîtrisée
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-3 bg-metal-black/50 rounded border border-metal-gray/50">
              <span className="text-gray-500 font-semibold text-sm">🔒 Voie non explorée</span>
              <p className="text-xs text-gray-500 mt-1">
                Explore les groupes de ce pilier pour débloquer cette classe et gagner de l'XP.
              </p>
            </div>
          )}

          {/* Description du bonus */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Bonus de la classe</p>
            <p className="text-sm text-metal-bone">
              +{Math.round((classMeta.bonus.multiplier - 1) * 100)}% d'XP sur tes actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BADGE COMPACT DE CLASSE
// ═══════════════════════════════════════════════════════════
function ClassBadge({ 
  classMeta, 
  maxLevel, 
  isActive, 
  onClick 
}: { 
  classMeta: ReturnType<typeof getClassMetadata>; 
  maxLevel: number; 
  isActive: boolean;
  onClick: () => void;
}) {
  const isMastered = maxLevel >= 50;
  const isExplored = maxLevel > 0;

  return (
    <div
      onClick={onClick}
      className={`
        group relative p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:scale-105
        ${isActive 
          ? 'border-metal-fire bg-metal-fire/5 shadow-lg shadow-metal-fire/10' 
          : isMastered
            ? 'border-yellow-500/60 bg-yellow-500/5'
            : isExplored
              ? 'border-metal-gray bg-metal-black/30'
              : 'border-metal-gray/40 bg-metal-black/20 opacity-60'}
      `}
    >
      {/* Badges flottants */}
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-metal-fire text-white text-[9px] font-bold rounded uppercase tracking-wider shadow-lg z-10">
          Active
        </div>
      )}
      {isMastered && (
        <div className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 bg-yellow-500 text-metal-black text-[9px] font-bold rounded uppercase tracking-wider shadow-lg z-10">
          🏆 Max
        </div>
      )}

      <div className="text-center">
        {/* Icône */}
        <div 
          className="text-3xl sm:text-4xl mb-1 transition-transform group-hover:scale-110"
          style={{ 
            filter: isExplored ? `drop-shadow(0 0 8px ${classMeta.color})` : 'none',
          }}
        >
          {classMeta.icon}
        </div>
        
        {/* Niveau ou statut */}
        <div className="text-[10px] sm:text-xs font-semibold" style={{ color: isExplored ? classMeta.color : '#6b7280' }}>
          {isExplored ? `Niv. ${maxLevel}` : '???'}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function PantheonSection() {
  const pantheon = usePantheon();
  const selectedClassId = useSelectedClass();
  const [selectedClassModal, setSelectedClassModal] = useState<ReturnType<typeof getClassMetadata> | null>(null);

  // Calcul du pourcentage de complétion (classes au niveau max 50)
  const maxLevel = 50;
  const masteredCount = Object.values(pantheon).filter((lvl) => lvl >= maxLevel).length;
  const totalCount = ALL_CLASSES.length;
  const totalLevelSum = Object.values(pantheon).reduce((sum, lvl) => sum + lvl, 0);

  return (
    <>
      <div className="metal-card p-2 sm:p-3 border-2 border-yellow-600/30 relative overflow-hidden">
        {/* Lueur d'arrière-plan dorée */}
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 opacity-10 pointer-events-none rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #eab308 0%, transparent 70%)' }} 
        />

        <div className="relative z-10">
          {/* En-tête du Panthéon */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 pb-2 border-b border-yellow-600/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏛️</span>
                <h2 className="font-metal text-xl sm:text-2xl text-yellow-500">
                  Le Panthéon
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 italic hidden sm:block">
                « Les exploits de chaque voie restent gravés dans la pierre. »
              </p>
            </div>

            {/* Stats globales du Panthéon */}
            <div className="flex gap-2">
              <div className="bg-metal-black/50 rounded-lg px-2 py-1 border border-yellow-600/20 text-center min-w-[70px]">
                <div className="text-lg font-bold text-yellow-400">{masteredCount}/{totalCount}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Maîtrisées</div>
              </div>
              <div className="bg-metal-black/50 rounded-lg px-2 py-1 border border-yellow-600/20 text-center min-w-[70px]">
                <div className="text-lg font-bold text-yellow-400">{totalLevelSum}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Niveaux</div>
              </div>
            </div>
          </div>

          {/* Grille des 9 classes (Badges compacts) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {ALL_CLASSES.map((classMeta) => (
              <ClassBadge 
                key={classMeta.id} 
                classMeta={classMeta} 
                maxLevel={pantheon[classMeta.id] || 0}
                isActive={selectedClassId === classMeta.id}
                onClick={() => setSelectedClassModal(classMeta)}
              />
            ))}
          </div>

          {/* Message de complétion */}
          {masteredCount === totalCount && (
            <div className="mt-3 p-2 bg-gradient-to-r from-yellow-500/10 via-yellow-400/20 to-yellow-500/10 border border-yellow-500/50 rounded-lg text-center animate-pulse">
              <p className="text-yellow-300 font-bold text-sm sm:text-base">
                👑 PANTHÉON COMPLET 👑
              </p>
              <p className="text-xs text-yellow-200/80 italic mt-1">
                Tu as maîtrisé les Neuf Voies. Tu es digne de siéger parmi les Anciens.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modale de détail */}
      {selectedClassModal && (
        <ClassModal 
          classMeta={selectedClassModal}
          maxLevel={pantheon[selectedClassModal.id] || 0}
          isActive={selectedClassId === selectedClassModal.id}
          onClose={() => setSelectedClassModal(null)}
        />
      )}
    </>
  );
}
