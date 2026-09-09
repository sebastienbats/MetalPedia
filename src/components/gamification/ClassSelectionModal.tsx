'use client';

import { useState, useEffect } from 'react';
import { ALL_CLASSES, getClassMetadata } from '@/lib/gamification/classes';
import { useClassStore, usePantheonLevel } from '@/stores/classStore';
import ClassInitiationQuiz from './ClassInitiationQuiz';
import type { CharacterClass } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function ClassDetailPanel({ classId }: { classId: CharacterClass }) {
  const pantheonLevel = usePantheonLevel(classId);
  const classMeta = getClassMetadata(classId);

  return (
    <div className="metal-card p-6 border-2 h-full sticky top-0" style={{ borderColor: classMeta.color }}>
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">{classMeta.icon}</div>
        <h3 className="font-metal text-2xl mb-1" style={{ color: classMeta.color }}>{classMeta.name}</h3>
        <p className="text-xs text-gray-500 uppercase tracking-wider">Pilier : {classMeta.pillar}</p>
        {pantheonLevel > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/40 rounded-full">
            <span className="text-yellow-400 text-sm">🏆</span>
            <span className="text-xs text-yellow-300 font-semibold">Niveau max atteint : {pantheonLevel}</span>
          </div>
        )}
      </div>
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-gray-200 mb-1">📜 Lore</h4>
          <p className="text-gray-400 text-xs italic leading-relaxed">"{classMeta.lore}"</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-200 mb-1">✨ Bonus de classe</h4>
          <p className="text-gray-400 text-xs">
            <span className="text-metal-fire font-bold">+{Math.round((classMeta.bonus.multiplier - 1) * 100)}% XP</span>
            {' '}{classMeta.bonus.type === 'low_listeners' && `sur les groupes de moins de ${classMeta.bonus.threshold} auditeurs`}
            {classMeta.bonus.type === 'reviews' && 'sur l\'écriture d\'avis'}
            {classMeta.bonus.type === 'all' && 'sur tous les gains d\'XP'}
            {classMeta.bonus.type === 'vintage' && `sur les groupes formés avant ${classMeta.bonus.threshold}`}
            {classMeta.bonus.type === 'rare_country' && 'sur les groupes de pays rares'}
            {classMeta.bonus.type === 'active_bands' && 'sur les groupes actifs'}
            {classMeta.bonus.type === 'favorites' && 'sur l\'ajout de favoris'}
            {classMeta.bonus.type === 'biography' && 'sur la lecture de biographies denses'}
            {classMeta.bonus.type === 'quiz' && 'sur la réussite des quiz'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ClassSelectionModal({ isOpen, onClose }: Props) {
  const { selectClass, selectedClass: currentClass } = useClassStore();
  const [selectedPreview, setSelectedPreview] = useState<CharacterClass | null>(null);
  const [initiationState, setInitiationState] = useState<'selecting' | 'quiz' | 'failed'>('selecting');

  // 🛡️ CORRECTION : Empêche le scroll de l'arrière-plan quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasExistingClass = currentClass !== null;

  const handleConfirmSelection = () => {
    if (!selectedPreview) return;
    setInitiationState('quiz');
  };

  const handleQuizSuccess = () => {
    if (selectedPreview) selectClass(selectedPreview);
    setInitiationState('selecting');
    setSelectedPreview(null);
    onClose();
  };

  const handleQuizFail = () => setInitiationState('failed');

  const handleBackToSelection = () => {
    setInitiationState('selecting');
    setSelectedPreview(null);
  };

  return (
    // 🛡️ CORRECTION : overflow-y-auto sur le wrapper pour gérer les petits écrans sans scroller le body
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      {/* 🛡️ CORRECTION : overflow-hidden sur la carte pour contenir le scroll à l'intérieur */}
      <div className="metal-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-metal-fire/50 my-8">
        
        {/* En-tête (Géré ici, pas dans le quiz) */}
        <div className="shrink-0 p-6 border-b border-metal-gray bg-gradient-to-r from-metal-fire/10 to-transparent flex items-center justify-between">
          <div>
            <h2 className="font-metal text-2xl md:text-3xl text-metal-rust">
              {initiationState === 'quiz' ? '⚔️ Épreuve d\'Adoubement' : '⚔️ Choisis ta Destinée'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {initiationState === 'quiz' 
                ? 'Prouve ta valeur au Conseil des Neuf Genres.' 
                : 'Le Conseil des Neuf Genres t\'offre une classe. Choisis avec sagesse, Métalleux.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl" aria-label="Fermer">✕</button>
        </div>

        {/* Contenu principal scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {hasExistingClass && initiationState === 'selecting' && (
            <div className="bg-metal-fire/10 border border-metal-fire/50 rounded-lg p-4 mb-6 flex gap-3 items-start animate-fade-in">
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="text-sm text-gray-300">
                <p className="font-bold text-metal-fire mb-1">Attention : Changement de voie</p>
                <p>Changer de classe réinitialisera votre <strong className="text-white">XP et votre titre de classe</strong> au niveau 1. Votre progression globale et votre Panthéon des Anciens seront <strong className="text-white">intégralement conservés</strong>.</p>
              </div>
            </div>
          )}

          {initiationState === 'failed' && selectedPreview && (
            <div className="text-center py-12 space-y-6 animate-fade-in">
              <div className="text-6xl">📜</div>
              <h3 className="font-metal text-3xl text-red-400">Adoubement Refusé</h3>
              <p className="text-sm text-gray-400 italic max-w-md mx-auto leading-relaxed">
                « Les Anciens estiment que ton esprit n'est pas encore assez aiguisé pour la voie du {getClassMetadata(selectedPreview).name}. 
                <br /><br />Explore davantage ce pilier, gagne en expérience, et reviens quand tu seras prêt. »
              </p>
              <button onClick={handleBackToSelection} className="px-8 py-3 bg-metal-gray text-gray-300 font-bold rounded-lg hover:bg-metal-gray/80 transition-all">
                Revenir à la sélection
              </button>
            </div>
          )}

          {initiationState === 'quiz' && selectedPreview && (
            <ClassInitiationQuiz 
              targetClass={selectedPreview} 
              onSuccess={handleQuizSuccess} 
              onFail={handleQuizFail} 
              onBack={handleBackToSelection} 
            />
          )}

          {initiationState === 'selecting' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_CLASSES.map((classMeta) => {
                  const isSelected = selectedPreview === classMeta.id;
                  return (
                    <button
                      key={classMeta.id}
                      onClick={() => setSelectedPreview(classMeta.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                        isSelected
                          ? 'border-metal-fire bg-metal-fire/10 scale-105 shadow-lg shadow-metal-fire/20'
                          : 'border-metal-gray hover:border-metal-fire/50 bg-metal-black/50 hover:bg-metal-black/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{classMeta.icon}</span>
                        <div>
                          <div className="font-bold text-sm" style={{ color: classMeta.color }}>{classMeta.name}</div>
                          <div className="text-xs text-gray-500">{classMeta.pillar}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{classMeta.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-1">
                {selectedPreview ? (
                  <ClassDetailPanel classId={selectedPreview} />
                ) : (
                  <div className="metal-card p-6 border-2 border-metal-gray h-full flex flex-col items-center justify-center text-center">
                    <div className="text-5xl mb-3 opacity-30">⚔️</div>
                    <p className="text-gray-500 text-sm">Sélectionne une classe pour voir ses détails</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Uniquement en mode sélection) */}
        {initiationState === 'selecting' && (
          <div className="shrink-0 p-6 border-t border-metal-gray bg-metal-black/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 text-center sm:text-left">
                {selectedPreview ? `Tu vas tenter l'adoubement : ${getClassMetadata(selectedPreview).name}` : 'Aucune classe sélectionnée'}
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Annuler</button>
                <button
                  onClick={handleConfirmSelection}
                  disabled={!selectedPreview}
                  className="px-6 py-2 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-metal-fire/20"
                >
                  Tenter l'Adoubement ⚔️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
