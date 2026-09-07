'use client';

import { ALL_CLASSES, getClassMetadata, getClassTitle } from '@/lib/gamification/classes';
import { usePantheon, useSelectedClass } from '@/stores/classStore';
import type { CharacterClass } from '@/types/api';

export default function PantheonSection() {
  const pantheon = usePantheon();
  const selectedClass = useSelectedClass();

  // Calcul du pourcentage de complétion (classes au niveau max 50)
  const maxLevel = 50;
  const masteredCount = Object.values(pantheon).filter((lvl) => lvl >= maxLevel).length;
  const totalCount = ALL_CLASSES.length;
  const totalLevelSum = Object.values(pantheon).reduce((sum, lvl) => sum + lvl, 0);

  return (
    <div className="metal-card p-6 border-2 border-yellow-600/30 relative overflow-hidden">
      {/* Lueur d'arrière-plan dorée */}
      <div 
        className="absolute -top-20 -right-20 w-80 h-80 opacity-10 pointer-events-none rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #eab308 0%, transparent 70%)' }} 
      />

      <div className="relative z-10">
        {/* En-tête du Panthéon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-yellow-600/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏛️</span>
              <h2 className="font-metal text-2xl text-yellow-500">
                Le Panthéon des Anciens
              </h2>
            </div>
            <p className="text-sm text-gray-400 italic">
              « Les exploits de chaque voie restent gravés dans la pierre, même quand tu changes de destin. »
            </p>
          </div>

          {/* Stats globales du Panthéon */}
          <div className="flex gap-3">
            <div className="bg-metal-black/50 rounded-lg px-4 py-2 border border-yellow-600/20 text-center">
              <div className="text-xl font-bold text-yellow-400">{masteredCount}/{totalCount}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Classes maîtrisées</div>
            </div>
            <div className="bg-metal-black/50 rounded-lg px-4 py-2 border border-yellow-600/20 text-center">
              <div className="text-xl font-bold text-yellow-400">{totalLevelSum}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Niveaux cumulés</div>
            </div>
          </div>
        </div>

        {/* Grille des 9 classes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_CLASSES.map((classMeta) => (
            <PantheonCard 
              key={classMeta.id} 
              classMeta={classMeta} 
              maxLevel={pantheon[classMeta.id] || 0}
              isActive={selectedClass === classMeta.id}
            />
          ))}
        </div>

        {/* Message de complétion */}
        {masteredCount === totalCount && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 via-yellow-400/20 to-yellow-500/10 border border-yellow-500/50 rounded-lg text-center animate-pulse">
            <p className="text-yellow-300 font-bold text-lg">
              👑 PANTHÉON COMPLET 👑
            </p>
            <p className="text-sm text-yellow-200/80 italic mt-1">
              Tu as maîtrisé les Neuf Voies. Tu es digne de siéger parmi les Anciens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CARTE INDIVIDUELLE DU PANTHÉON
// ═══════════════════════════════════════════════════════════

interface PantheonCardProps {
  classMeta: ReturnType<typeof getClassMetadata>;
  maxLevel: number;
  isActive: boolean;
}

function PantheonCard({ classMeta, maxLevel, isActive }: PantheonCardProps) {
  const isMastered = maxLevel >= 50;
  const isExplored = maxLevel > 0;

  // Déterminer le titre atteint
  const title = isExplored ? getClassTitle(classMeta.id, maxLevel) : 'Non explorée';

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${isActive 
          ? 'border-metal-fire bg-metal-fire/5 shadow-lg shadow-metal-fire/10' 
          : isMastered
            ? 'border-yellow-500/60 bg-yellow-500/5'
            : isExplored
              ? 'border-metal-gray bg-metal-black/30'
              : 'border-metal-gray/40 bg-metal-black/20 opacity-60'}
      `}
    >
      {/* Badge "Classe active" */}
      {isActive && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-metal-fire text-white text-[10px] font-bold rounded uppercase tracking-wider shadow-lg">
          Active
        </div>
      )}

      {/* Badge "Maîtrisée" */}
      {isMastered && (
        <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-yellow-500 text-metal-black text-[10px] font-bold rounded uppercase tracking-wider shadow-lg">
          🏆 Maîtrisée
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icône de la classe */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 shrink-0"
          style={{
            borderColor: isExplored ? classMeta.color : '#4b5563',
            backgroundColor: isExplored ? `${classMeta.color}20` : 'transparent',
            boxShadow: isExplored ? `0 0 10px ${classMeta.color}40` : 'none',
          }}
        >
          {classMeta.icon}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div 
            className="font-bold text-sm truncate"
            style={{ color: isExplored ? classMeta.color : '#6b7280' }}
          >
            {classMeta.name}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            {classMeta.pillar}
          </div>

          {isExplored ? (
            <>
              <div className="text-xs text-gray-300 font-semibold">
                Niveau max : <span style={{ color: classMeta.color }}>{maxLevel}</span>
              </div>
              <div className="text-[11px] text-gray-400 italic truncate">
                « {title} »
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500 italic">
              Voie non explorée
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
