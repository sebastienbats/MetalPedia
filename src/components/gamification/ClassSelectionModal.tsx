'use client';

import { useState } from 'react';
import { ALL_CLASSES, getClassMetadata } from '@/lib/gamification/classes';
import { useClassStore } from '@/stores/classStore';
import type { CharacterClass } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClassSelectionModal({ isOpen, onClose }: Props) {
  const { selectClass } = useClassStore();
  const [selectedPreview, setSelectedPreview] = useState<CharacterClass | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const previewClass = selectedPreview ? getClassMetadata(selectedPreview) : null;

  const handleConfirm = () => {
    if (!selectedPreview) return;
    setIsConfirming(true);
    selectClass(selectedPreview);
    setTimeout(() => {
      setIsConfirming(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="metal-card w-full max-w-6xl max-h-[90vh] overflow-hidden border-2 border-metal-fire/50 flex flex-col">
        
        {/* En-tête */}
        <div className="p-6 border-b border-metal-gray bg-gradient-to-r from-metal-fire/10 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-metal text-3xl md:text-4xl text-metal-rust">
                ⚔️ Choisis ta Destinée
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Le Conseil des Neuf Genres t'offre une classe. Choisis avec sagesse, Métalleux.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Grille des classes */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_CLASSES.map((classMeta) => {
                const isSelected = selectedPreview === classMeta.id;
                return (
                  <button
                    key={classMeta.id}
                    onClick={() => setSelectedPreview(classMeta.id)}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected
                        ? 'border-metal-fire bg-metal-fire/10 scale-105 shadow-lg shadow-metal-fire/20'
                        : 'border-metal-gray hover:border-metal-fire/50 bg-metal-black/50 hover:bg-metal-black/80'}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{classMeta.icon}</span>
                      <div>
                        <div 
                          className="font-bold text-sm"
                          style={{ color: classMeta.color }}
                        >
                          {classMeta.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {classMeta.pillar}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {classMeta.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Panneau de détail */}
            <div className="lg:col-span-1">
              {previewClass ? (
                <div 
                  className="metal-card p-6 border-2 h-full sticky top-0"
                  style={{ borderColor: previewClass.color }}
                >
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">{previewClass.icon}</div>
                    <h3 
                      className="font-metal text-2xl mb-1"
                      style={{ color: previewClass.color }}
                    >
                      {previewClass.name}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Pilier : {previewClass.pillar}
                    </p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-1">📜 Lore</h4>
                      <p className="text-gray-400 text-xs italic leading-relaxed">
                        "{previewClass.lore}"
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-200 mb-1">✨ Bonus de classe</h4>
                      <p className="text-gray-400 text-xs">
                        <span className="text-metal-fire font-bold">
                          +{Math.round((previewClass.bonus.multiplier - 1) * 100)}% XP
                        </span>
                        {' '}
                        {previewClass.bonus.type === 'low_listeners' && `sur les groupes de moins de ${previewClass.bonus.threshold} auditeurs`}
                        {previewClass.bonus.type === 'reviews' && 'sur l\'écriture d\'avis'}
                        {previewClass.bonus.type === 'all' && 'sur tous les gains d\'XP'}
                        {previewClass.bonus.type === 'vintage' && `sur les groupes formés avant ${previewClass.bonus.threshold}`}
                        {previewClass.bonus.type === 'rare_country' && 'sur les groupes de pays rares'}
                        {previewClass.bonus.type === 'active_bands' && 'sur les groupes actifs'}
                        {previewClass.bonus.type === 'favorites' && 'sur l\'ajout de favoris'}
                        {previewClass.bonus.type === 'biography' && 'sur la lecture de biographies denses'}
                        {previewClass.bonus.type === 'quiz' && 'sur la réussite des quiz'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-200 mb-1">🏆 Titres débloquables</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {previewClass.titles.map((t) => (
                          <li key={t.level} className="flex justify-between">
                            <span>Niv. {t.level}</span>
                            <span className="text-gray-300">{t.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="metal-card p-6 border-2 border-metal-gray h-full flex flex-col items-center justify-center text-center">
                  <div className="text-5xl mb-3 opacity-30">⚔️</div>
                  <p className="text-gray-500 text-sm">
                    Sélectionne une classe pour voir ses détails
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer avec bouton de confirmation */}
        <div className="p-6 border-t border-metal-gray bg-metal-black/50">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              {selectedPreview 
                ? `Tu vas devenir : ${getClassMetadata(selectedPreview).name}`
                : 'Aucune classe sélectionnée'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedPreview || isConfirming}
                className="px-6 py-2 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-metal-fire/20"
              >
                {isConfirming ? '⚔️ Adoubement en cours...' : 'Confirmer mon choix'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
