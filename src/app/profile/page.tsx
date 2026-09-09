'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/api/authApi';
import { useClassStore, useClassMetadata, useClassProgress } from '@/stores/classStore';
import { getClassTitle } from '@/lib/gamification/classes';
import ClassSelectionModal from '@/components/gamification/ClassSelectionModal';
import ClassMilestones from '@/components/gamification/ClassMilestones'; // 🆕 Import des titres visuels
import PantheonSection from '@/components/gamification/PantheonSection';
import PlayerCard from '@/components/gamification/PlayerCard';
import BadgesPanel from '@/components/gamification/BadgesPanel';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import LoreGrimoire from '@/components/gamification/LoreGrimoire';
import FloatingRunes from '@/components/ui/FloatingRunes';
import StatsPanel from '@/components/visual/StatsPanel';

export default function ProfilePage() {
  const { data: user } = useAuth();
  const { selectedClass } = useClassStore();
  const classMeta = useClassMetadata();
  const classProgress = useClassProgress();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedClass) {
        setIsModalOpen(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedClass]);

  return (
    <div className="space-y-8 pb-12">
      {/* ═══════════════════════════════════════════
          EN-TÊTE & INFO DOUBLE PROGRESSION
      ═══════════════════════════════════════════ */}
      <header className="text-center border-b border-metal-gray pb-6">
        <h3 className="font-metal text-4xl md:text-5xl text-metal-rust mb-3">🪶 Le Metalverse</h3>
        {/* 📖 GRIMOIRE DES ANCIENS */}
        <div className="p-6">
          {/* 🌌 CALQUE D'ARRIÈRE-PLAN : Les Runes Flottantes */}
          <FloatingRunes 
            count={35}         // Un peu plus dense pour bien remplir la zone
            maxScale={8}       // Grossissement spectaculaire
            baseDuration={15}  // Mouvement lent et majestueux
            colorClass="text-amber-400" 
            opacityFactor={0.08} // Légèrement plus transparent car c'est derrière le titre aussi
          />
        <LoreGrimoire />
        </div>  
        <h3 className="font-metal text-4xl md:text-5xl text-metal-rust mb-3">⚔️ Ta Légende</h3>
        <p className="text-gray-400 font-serif mb-4">Le Conseil des Neuf Genres observe ta progression</p>
        
        {/* Boîte d'information explicative */}
        <div className="max-w-2xl mx-auto bg-metal-fire/5 border border-metal-fire/20 rounded-lg p-4 text-left flex gap-3 items-start">
          <span className="text-2xl shrink-0">💡</span>
          <div className="text-sm text-gray-300">
            <p className="font-bold text-metal-fire mb-1">Système de Double Progression :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><span className="text-gray-200">Progression Globale</span> : Monte avec <strong>toutes</strong> tes actions (vues, favoris, reviews).</li>
              <li><span className="text-gray-200">Maîtrise de Classe</span> : Monte <strong>uniquement</strong> lorsque tu déclenches ton bonus de classe spécifique (ex: explorer des groupes obscurs pour le Nécromancien).</li>
            </ul>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          SECTION CLASSE DE PERSONNAGE
      ═══════════════════════════════════════════ */}
      <div className="metal-card p-6 border-2 border-metal-gray relative overflow-hidden">
        {classMeta && (
          <div 
            className="absolute -top-10 -right-10 w-64 h-64 opacity-10 pointer-events-none rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${classMeta.color} 0%, transparent 70%)` }} 
          />
        )}
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {classMeta && classProgress ? (
            <>
              {/* Avatar de classe */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl border-4 shadow-lg shrink-0"
                style={{
                  borderColor: classMeta.color,
                  backgroundColor: `${classMeta.color}20`,
                  boxShadow: `0 0 20px ${classMeta.color}60`,
                }}
              >
                {classMeta.icon}
              </div>

              {/* Infos de classe */}
              <div className="flex-1 w-full text-center md:text-left">
                {/* Badge de distinction Classe */}
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
                  <span className="px-2 py-1 bg-metal-fire/10 text-metal-fire text-[10px] font-bold rounded uppercase tracking-wider border border-metal-fire/30">
                    ⚔️ Maîtrise de Classe
                  </span>
                  <span className="text-xs text-gray-500 italic">Augmente uniquement via ton bonus de classe</span>
                </div>

                <h2 className="font-metal text-3xl mb-1" style={{ color: classMeta.color }}>
                  {classMeta.name}
                </h2>
                
                {/* 🆕 BADGE DE TITRE ACTUEL TRÈS VISIBLE */}
                <p className="text-sm font-semibold mb-4 inline-block px-3 py-1 rounded-full border" 
                   style={{ 
                     backgroundColor: `${classMeta.color}15`, 
                     borderColor: classMeta.color, 
                     color: classMeta.color 
                   }}>
                  🏆 {getClassTitle(classMeta.id, classProgress.currentLevel)}
                </p>

                {/* Barre d'XP de classe */}
                <div className="max-w-md mx-auto md:mx-0">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="font-semibold text-gray-300">Niveau {classProgress.currentLevel}</span>
                    <span>
                      {classProgress.nextLevelXp === Infinity 
                        ? 'MAX' 
                        : `${classProgress.nextLevelXp.toLocaleString()} XP`}
                    </span>
                  </div>
                  <div className="h-3 bg-metal-gray rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${classProgress.progress}%`,
                        background: `linear-gradient(to right, ${classMeta.color}, ${classMeta.color}dd)`,
                        boxShadow: `0 0 10px ${classMeta.color}80`,
                      }}
                    />
                  </div>
                </div>

                {/* Description du bonus actif */}
                <div className="mt-4 text-xs text-gray-400 bg-metal-black/50 p-3 rounded-lg border border-metal-gray/50 inline-block">
                  ✨ <span className="text-gray-200 font-semibold">Bonus actif :</span>{' '}
                  <span className="text-metal-fire font-bold">
                    +{Math.round((classMeta.bonus.multiplier - 1) * 100)}% XP
                  </span>
                  {' '}
                  {classMeta.bonus.type === 'all' && 'sur tous les gains d\'XP'}
                  {classMeta.bonus.type === 'low_listeners' && `sur les groupes obscurs (<${classMeta.bonus.threshold} auditeurs)`}
                  {classMeta.bonus.type === 'reviews' && 'sur tes reviews'}
                  {classMeta.bonus.type === 'vintage' && `sur les groupes formés avant ${classMeta.bonus.threshold}`}
                  {classMeta.bonus.type === 'favorites' && 'sur tes ajouts en favoris'}
                  {classMeta.bonus.type === 'active_bands' && 'sur les groupes actifs'}
                  {classMeta.bonus.type === 'biography' && 'sur la lecture de biographies denses'}
                  {classMeta.bonus.type === 'quiz' && 'sur la réussite des quiz'}
                  {classMeta.bonus.type === 'rare_country' && 'sur les groupes de pays rares'}
                </div>
              </div>

              {/* Bouton changer de classe */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="shrink-0 px-4 py-2 text-sm text-gray-400 hover:text-metal-fire border border-metal-gray hover:border-metal-fire rounded-lg transition-all bg-metal-black/30"
              >
                Changer de voie
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl opacity-30 shrink-0">⚔️</div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-metal text-2xl text-gray-400 mb-2">
                  Aucune classe choisie
                </h2>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  Le Conseil des Neuf Genres t'attend. Choisis ta destinée pour débloquer des bonus d'XP uniques et des quêtes spéciales.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20"
                >
                  Choisir ma classe
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ClassSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ═══════════════════════════════════════════
          🎖️ VOIE DE L'ASCENSION (TITRES DE CLASSE)
      ═══════════════════════════════════════════ */}
      {selectedClass && <ClassMilestones />}

      {/* ═══════════════════════════════════════════
          🏛️ PANTHÉON DES ANCIENS
          Affiche le niveau MAX atteint pour chaque classe
      ═══════════════════════════════════════════ */}
      <PantheonSection />

      {/* ═══════════════════════════════════════════
          BANNIÈRE D'INVITATION (Non connectés)
      ═══════════════════════════════════════════ */}
      {!user && (
        <div className="metal-card p-6 border-2 border-metal-fire/50 bg-gradient-to-r from-metal-fire/10 to-transparent">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-5xl shrink-0">🔐</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-metal-fire mb-2">
                Sauvegarde ta progression dans le cloud
              </h2>
              <p className="text-gray-300 text-sm">
                Crée un compte pour synchroniser ton XP, tes badges, ta classe et tes favoris sur tous tes appareils. 
              </p>
            </div>
            <Link href="/login" className="shrink-0 px-6 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 whitespace-nowrap">
              Se connecter
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CONTENU PRINCIPAL (Grille)
      ═══════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <PlayerCard />
          <StatsPanel />
        </div>
        <div className="space-y-6">
          <QuestsPanel />
          <BadgesPanel />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          PIED DE PAGE INFO (Non connectés)
      ═══════════════════════════════════════════ */}
      {!user && (
        <div className="text-center py-8 border-t border-metal-gray">
          <p className="text-gray-500 text-sm">
            💡 Tes statistiques et ta classe sont actuellement sauvegardées localement dans ton navigateur.
            <br />
            <Link href="/login" className="text-metal-fire hover:underline font-semibold">
              Connecte-toi
            </Link>
            {' '}pour les synchroniser définitivement dans le cloud.
          </p>
        </div>
      )}
    </div>
  );
}
