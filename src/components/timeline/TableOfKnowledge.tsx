'use client';

import { useState } from 'react';
import { useFragmentStore } from '@/stores/fragmentStore';
import { useClassStore } from '@/stores/classStore';

// ═══════════════════════════════════════════════════════════
// MÉTADONNÉES DES PILIERS
// ═══════════════════════════════════════════════════════════
const PILLARS = [
  { id: 'Heavy Metal', icon: '🎸', color: '#8b0000', fragments: [
    { id: 1, rune: 'ᚦ', title: "L'Enclume du Néant" },
    { id: 2, rune: 'ᚱ', title: 'Le Grimoire de la Paranoïa' },
    { id: 3, rune: 'ᚺ', title: 'La Brume Pourpre' },
    { id: 4, rune: 'ᛟ', title: 'Le Relais de la Chaussée' },
    { id: 5, rune: 'ᛉ', title: 'Le Porte-Étendard' },
    { id: 6, rune: 'ᛏ', title: "L'Uniforme du Visible" },
    { id: 7, rune: 'ᛒ', title: 'La Cité des Bannières Oubliées' },
  ]},
  { id: 'Thrash Metal', icon: '⚡', color: '#d63031', fragments: [
    { id: 8, rune: 'ᚠ', title: "L'Étincelle de la Baie" },
    { id: 9, rune: 'ᚢ', title: 'Le Premier Coup de Tonnerre' },
    { id: 10, rune: 'ᚲ', title: 'Les 29 Minutes du Chaos' },
    { id: 11, rune: 'ᚷ', title: 'Le Proscrit et sa Couronne' },
    { id: 12, rune: 'ᚹ', title: 'Le Groove des Fosses' },
    { id: 47, rune: 'ᛈ', title: "La Tempête de l'Acier" },
    { id: 48, rune: 'ᛊ', title: 'Le Pacte de la Baie' },
    { id: 49, rune: 'ᛗ', title: "La Lame d'Essen" },
    { id: 50, rune: 'ᛚ', title: 'Le Nouvel Ordre de la Baie' },
    { id: 70, rune: 'ᛝ', title: 'La Résistance Moderne' },
    { id: 71, rune: 'ᛞ', title: 'Le Chant des Vaincus qui se Relèvent' },
  ]},
  { id: 'Death Metal', icon: '🩸', color: '#2d3436', fragments: [
    { id: 13, rune: 'ᚾ', title: 'Le Voile Déchiré' },
    { id: 14, rune: 'ᛇ', title: 'La Voix des Morts' },
    { id: 15, rune: 'ᛡ', title: 'Les Grimoires Interdits' },
    { id: 16, rune: 'ᛢ', title: 'Le Registre des Horreurs' },
    { id: 43, rune: 'ᛣ', title: 'La Lenteur de la Putréfaction' },
    { id: 44, rune: 'ᛤ', title: 'La Pierre du Nord' },
    { id: 45, rune: 'ᚫ', title: 'Le Blasphème Nécessaire' },
    { id: 51, rune: 'ᛃ', title: 'Le Cycle des Dynasties' },
    { id: 52, rune: 'ᛖ', title: "L'Histoire Cachée" },
    { id: 72, rune: 'ᚣ', title: 'L\'Atlas de la Fin' },
    { id: 73, rune: 'ᛁ', title: 'Le Désert qui Attend' },
  ]},
  { id: 'Black Metal', icon: '💀', color: '#000000', fragments: [
    { id: 17, rune: 'ᛉ', title: 'Les Premiers Hérétiques' },
    { id: 18, rune: 'ᛊ', title: "L'Hiver Norvégien" },
    { id: 19, rune: 'ᛏ', title: 'Le Ciel du Nord en Flammes' },
    { id: 20, rune: 'ᛒ', title: 'Le Temple Souillé' },
    { id: 21, rune: 'ᛗ', title: 'Le Prisonnier de la Tour' },
    { id: 54, rune: 'ᛚ', title: 'La Symphonie des Ténèbres' },
    { id: 55, rune: 'ᛜ', title: 'Le Blizzard Éternel' },
    { id: 56, rune: 'ᛞ', title: 'La Beauté Maudite' },
    { id: 74, rune: 'ᛟ', title: "L'Âge de l'Excuse" },
    { id: 75, rune: 'ᚠ', title: 'Le Soleil Mourant' },
  ]},
  { id: 'Power Metal', icon: '🔥', color: '#e17055', fragments: [
    { id: 22, rune: 'ᚱ', title: "Les Portes de l'Aube" },
    { id: 23, rune: 'ᛋ', title: 'La Bibliothèque des Bardes' },
    { id: 24, rune: 'ᚲ', title: 'La Croisade Lumineuse' },
    { id: 25, rune: 'ᚹ', title: 'La Voix de la Forêt' },
    { id: 57, rune: 'ᚷ', title: 'Le Serment des Rois' },
    { id: 58, rune: 'ᛃ', title: 'La Carte des Terres Enchantées' },
    { id: 59, rune: 'ᛖ', title: 'Le Cheval de Lumière' },
    { id: 76, rune: 'ᛏ', title: 'Le Retour des Années 80' },
    { id: 77, rune: 'ᛞ', title: "L'Étoile Dragon" },
  ]},
  { id: 'Doom Metal', icon: '🧟', color: '#636e72', fragments: [
    { id: 36, rune: 'ᚨ', title: 'Le Premier Souffle du Vide' },
    { id: 60, rune: 'ᛋ', title: 'Le Soleil Noir' },
    { id: 37, rune: 'ᛒ', title: "L'Arbre qui Pousse dans le Vide" },
    { id: 38, rune: 'ᛖ', title: 'Le Cheval de Fumée' },
    { id: 39, rune: 'ᛃ', title: 'Le Cycle Éternel' },
    { id: 78, rune: 'ᛗ', title: 'L\'Homme qui Porte le Cercueil' },
    { id: 79, rune: 'ᛏ', title: 'Le Gardien du Vide Existentiel' },
  ]},
  { id: 'Progressive Metal', icon: '🌀', color: '#00b894', fragments: [
    { id: 62, rune: 'ᚳ', title: 'Le Premier Cartographe' },
    { id: 63, rune: 'ᛠ', title: 'La Spirale de Fibonacci' },
    { id: 64, rune: 'ᚻ', title: 'Le Pont entre les Mondes' },
    { id: 31, rune: 'ᚪ', title: 'Le Chêne qui Plie le Temps' },
    { id: 32, rune: 'ᚩ', title: "L'Algorithme Vivant" },
    { id: 33, rune: 'ᛥ', title: 'Le Réseau des Cartographes' },
    { id: 82, rune: 'ᚬ', title: 'Le Cycle du Vecteur' },
    { id: 83, rune: '᛫', title: 'Le Pivot des Genres' },
  ]},
  { id: 'Folk Metal', icon: '🍀', color: '#27ae60', fragments: [
    { id: 40, rune: 'ᛚ', title: 'Les Racines Réveillées' },
    { id: 41, rune: 'ᛝ', title: 'Les Fils de la Terre Mère' },
    { id: 42, rune: 'ᛟ', title: 'Les Héros de la Forêt' },
    { id: 86, rune: 'ᛞ', title: 'La Fête de la Forêt' },
    { id: 61, rune: 'ᚠ', title: 'Le Peuple des Gaels' },
    { id: 80, rune: 'ᛁ', title: 'Les Runes de Glace' },
    { id: 81, rune: 'ᛃ', title: 'La Renaissance Celte' },
  ]},
  { id: 'Metalcore', icon: '💥', color: '#6c5ce7', fragments: [
    { id: 26, rune: 'ᚴ', title: 'La Plaie Ouverte' },
    { id: 27, rune: 'ᚵ', title: 'Le Feu Étranger' },
    { id: 28, rune: 'ᚶ', title: 'La Voix qui Crie la Vérité' },
    { id: 29, rune: 'ᚸ', title: 'Le Don Brisé' },
    { id: 30, rune: 'ᚼ', title: 'La Grêle qui Purifie' },
    { id: 65, rune: 'ᚽ', title: 'La Rage Pure' },
    { id: 66, rune: 'ᚿ', title: 'Le Voyage Astral' },
    { id: 67, rune: 'ᛀ', title: 'La Machine qui Pense' },
    { id: 84, rune: 'ᛂ', title: "L'Héritage du Deuil" },
    { id: 85, rune: 'ᛄ', title: 'La Glace Éternelle Bleue' },
  ]},
];

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function TableOfKnowledge() {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const { collectedIds } = useFragmentStore();
  const { selectedClass } = useClassStore();

  // Calculer la progression globale
  const totalFragments = PILLARS.reduce((sum, p) => sum + p.fragments.length, 0);
  const collectedCount = PILLARS.reduce((sum, p) => 
    sum + p.fragments.filter(f => collectedIds.includes(f.id)).length, 0
  );
  const globalProgress = totalFragments > 0 ? (collectedCount / totalFragments) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h2 id="decouvertes-title" class="font-metal text-2xl sm:text-3xl md:text-4xl text-metal-rust mb-2">📜 La Table du Savoir</h2>
        <p class="text-gray-400 font-serif text-sm sm:text-base mb-6">
          {selectedClass 
            ? `En tant que ${selectedClass}, explore les fragments du Metalverse`
            : 'Choisis une classe pour explorer les fragments du Metalverse'}
        </p>
      </div>
        
        {/* Progression globale */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-1">
            <span>Progression globale</span>
            <span>{collectedCount}/{totalFragments} fragments</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grille des 9 Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PILLARS.map((pillar) => {
          const collected = pillar.fragments.filter(f => collectedIds.includes(f.id)).length;
          const progress = pillar.fragments.length > 0 
            ? (collected / pillar.fragments.length) * 100 
            : 0;
          const isComplete = collected === pillar.fragments.length;
          const isSelected = selectedPillar === pillar.id;

          return (
            <div
              key={pillar.id}
              onClick={() => setSelectedPillar(isSelected ? null : pillar.id)}
              className={`
                rounded-xl p-5 cursor-pointer transition-all duration-300 border-2
                ${isSelected ? 'ring-2 ring-yellow-400 scale-[1.02]' : 'hover:scale-[1.01]'}
                ${isComplete ? 'border-yellow-500' : 'border-gray-700'}
              `}
              style={{ backgroundColor: `${pillar.color}15` }}
            >
              {/* En-tête de la carte */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{pillar.icon}</span>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-bold" style={{ color: pillar.color }}>
                    {pillar.id}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{collected}/{pillar.fragments.length}</span>
                    {isComplete && <span className="text-yellow-400">✨ Complète !</span>}
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: pillar.color 
                  }}
                />
              </div>

              {/* Liste des fragments */}
              <div className="space-y-2">
                {pillar.fragments.map((fragment) => {
                  const isCollected = collectedIds.includes(fragment.id);
                  return (
                    <div
                      key={fragment.id}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg text-sm
                        ${isCollected 
                          ? 'bg-black/30 text-white' 
                          : 'bg-black/10 text-gray-500'}
                      `}
                    >
                      <span className={`text-lg ${isCollected ? '' : 'opacity-30'}`}>
                        {isCollected ? fragment.rune : '?'}
                      </span>
                      <span className="flex-1">
                        {isCollected ? fragment.title : 'Fragment inconnu...'}
                      </span>
                      {isCollected && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>🔮 Explore la Timeline pour collecter des fragments et compléter les Tables du Savoir</p>
      </div>
    </div>
  );
}
