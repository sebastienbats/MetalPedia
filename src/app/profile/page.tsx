'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/api/authApi';
import { useClassStore, useClassMetadata, useClassProgress } from '@/stores/classStore';
import { useAchievementStore } from '@/stores/achievementStore';
import { useFragmentStore } from '@/stores/fragmentStore';
import { useFavoritesCloudSync } from '@/hooks/useFavoritesCloudSync';
import { getClassTitle } from '@/lib/gamification/classes';
import ClassSelectionModal from '@/components/gamification/ClassSelectionModal';
import ClassMilestones from '@/components/gamification/ClassMilestones';
import PantheonSection from '@/components/gamification/PantheonSection';
import PlayerCard from '@/components/gamification/PlayerCard';
import BadgesPanel from '@/components/gamification/BadgesPanel';
import TimelineBadgesPanel from '@/components/gamification/TimelineBadgesPanel';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import TableOfKnowledge from '@/components/timeline/TableOfKnowledge';
import LoreGrimoire from '@/components/gamification/LoreGrimoire'; // ✅ Garde cet import
import FloatingRunes from '@/components/ui/FloatingRunes';
import StatsPanel from '@/components/visual/StatsPanel';
import AILogoGenerator from '@/components/ai/AILogoGenerator';

function getBonusDescription(type: string, threshold?: number): string {
  const descriptions: Record<string, string> = {
    all: "sur tous les gains d'XP",
    low_listeners: `sur les groupes obscurs (<${threshold} auditeurs)`,
    reviews: 'sur tes reviews',
    vintage: `sur les groupes formés avant ${threshold}`,
    favorites: 'sur tes ajouts en favoris',
    active_bands: 'sur les groupes actifs',
    biography: 'sur la lecture de biographies denses',
    quiz: 'sur la réussite des quiz',
    rare_country: 'sur les groupes de pays rares',
  };
  return descriptions[type] || '';
}

function ChapterNav() {
  const chapters = [
    { id: 'origines', label: 'Origines', icon: '🪶' },
    { id: 'incarnation', label: 'Incarnation', icon: '⚔️' },
    { id: 'exploits', label: 'Exploits', icon: '🏆' },
    { id: 'decouvertes', label: 'Découvertes', icon: '📜' },
    { id: 'forge', label: 'La Forge', icon: '🔥' },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="Navigation des chapitres" className="sticky top-2 z-30">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide bg-metal-black/90 backdrop-blur-md border border-metal-gray rounded-lg p-2 shadow-lg">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => scrollTo(chapter.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-metal-fire hover:bg-metal-fire/10 rounded-md transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-metal-fire/50"
          >
            <span aria-hidden="true">{chapter.icon}</span>
            <span>{chapter.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function ChapterDivider({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 my-3 sm:my-6" aria-hidden="true">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-metal-fire/40 to-metal-fire/60" />
      <div className="flex items-center gap-3 px-4 py-1.5 bg-metal-black/60 border border-metal-fire/30 rounded-full">
        <span className="font-metal text-metal-fire text-sm sm:text-base">{number}</span>
        <span className="w-1 h-1 rounded-full bg-metal-fire/60" />
        <span className="font-serif text-metal-bone text-xs sm:text-sm uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-metal-fire/40 to-metal-fire/60" />
    </div>
  );
}

export default function ProfilePage() {
  const { data: user } = useAuth();
  const { selectedClass } = useClassStore();
  const classMeta = useClassMetadata();
  const classProgress = useClassProgress();
  
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isGrimoireOpen, setIsGrimoireOpen] = useState(false); // ✅ NOUVEAU : État pour la modale du grimoire

  // ✅ Déclenche le chargement cloud des favoris
  useFavoritesCloudSync();

  useEffect(() => {
    const collectedIds = useFragmentStore.getState().collectedIds;
    if (collectedIds.length > 0) {
      useAchievementStore.getState().checkTimelineAchievements(collectedIds);
    }
  }, []);

  return (
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12 space-y-6 sm:space-y-8">
      
      {/* ═══════════════════════════════════════════════════════════
          1. EN-TÊTE & NAVIGATION
      ═══════════════════════════════════════════════════════════ */}
      <header className="text-center">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2 sm:mb-4">
          ⚔️ Ta Légende
        </h1>
        <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg">
          Le Conseil des Neuf Genres observe ta progression
        </p>
      </header>

      <ChapterNav />

      {/* ═══════════════════════════════════════════════════════════
          2. TABLEAU DE BORD PRINCIPAL (Hors chapitres)
      ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <PlayerCard />
          <StatsPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <QuestsPanel />
          <BadgesPanel />
        </div>

        {!user && (
          <section
            aria-label="Invitation à créer un compte"
            className="metal-card p-3 sm:p-5 border-2 border-metal-fire/50 bg-gradient-to-r from-metal-fire/10 to-transparent"
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
              <div className="text-3xl sm:text-5xl shrink-0" aria-hidden="true">
                🔐
              </div>
              <div className="flex-1">
                <h2 className="font-metal text-lg sm:text-3xl text-metal-fire mb-2">
                  Sauvegarde ta progression dans le cloud
                </h2>
                <p className="text-metal-bone font-serif text-xs sm:text-sm lg:text-base">
                  Crée un compte pour synchroniser ton XP, tes badges, ta classe et tes favoris sur
                  tous tes appareils. Actuellement, tes données sont sauvegardées localement.
                </p>
              </div>
              <Link
                href="/login"
                className="shrink-0 px-6 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-metal-fire/50 w-full sm:w-auto text-center text-sm sm:text-base"
              >
                Se connecter
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          3. CHAPITRES DÉTAILLÉS
      ═══════════════════════════════════════════════════════════ */}
      
      {/* Chapitre I : Origines */}
      <section id="origines" aria-labelledby="origines-title" className="scroll-mt-24 space-y-3">
        <ChapterDivider number="I" title="Les Origines" />
        <div className="text-center">
          <h2 id="origines-title" className="font-metal text-xl sm:text-3xl text-metal-fire mb-2 sm:mb-3">
            🪶 Le Grimoire du Metalverse
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
            Les récits fondateurs du monde que tu explores — à lire avant de choisir ta voie
          </p>
        </div>
        
        {/* ✅ CORRECTION : Remplacement du LoreGrimoire direct par un bouton d'invitation immersif */}
        <div className="relative p-6 sm:p-10 overflow-hidden rounded-xl bg-metal-black/40 border border-amber-900/40 flex flex-col items-center justify-center min-h-[300px]">
          <FloatingRunes preset="parchment" />
          <div className="relative z-10 text-center">
            <p className="text-amber-200/60 font-serif text-sm sm:text-base mb-6 italic max-w-md mx-auto">
              "Les secrets du Metalverse t'attendent dans les pages anciennes..."
            </p>
            <button
              onClick={() => setIsGrimoireOpen(true)}
              className="group flex flex-col items-center gap-4 px-10 py-8 bg-metal-black/60 border-2 border-amber-700/50 rounded-xl hover:border-amber-500 hover:bg-amber-900/20 transition-all duration-300 shadow-[0_0_15px_rgba(180,83,9,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
            >
              <span className="text-6xl filter drop-shadow-md group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all animate-pulse-slow">
                📜
              </span>
              <span className="font-metal text-xl sm:text-2xl text-amber-200 group-hover:text-amber-100 tracking-widest uppercase">
                Ouvrir le Grimoire
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Chapitre II : Incarnation */}
      <section id="incarnation" aria-labelledby="incarnation-title" className="scroll-mt-24 space-y-3 sm:space-y-4">
        <ChapterDivider number="II" title="Ton Incarnation" />
        <div className="text-center">
          <h2 id="incarnation-title" className="font-metal text-xl sm:text-3xl text-metal-fire mb-2 sm:mb-3">
            ⚔️ Ta classe actuelle
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
            Choisis ta destinée et le Conseil des Neuf Genres te donne accès aux maîtrises de classes
          </p>
        </div>
        <div className="metal-card p-1 sm:p-1.5 border-2 border-metal-gray relative overflow-hidden">
          {classMeta && (
            <div
              className="absolute -top-10 -right-10 w-64 h-64 opacity-10 pointer-events-none rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${classMeta.color} 0%, transparent 70%)` }}
              aria-hidden="true"
            />
          )}

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-3 sm:gap-6">
            {classMeta && classProgress ? (
              <>
                <div
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-5xl border-4 shadow-lg shrink-0 transition-transform hover:scale-105"
                  style={{
                    borderColor: classMeta.color,
                    backgroundColor: `${classMeta.color}20`,
                    boxShadow: `0 0 20px ${classMeta.color}60`,
                  }}
                  aria-label={`Avatar de la classe ${classMeta.name}`}
                >
                  {classMeta.icon}
                </div>

                <div className="flex-1 w-full text-center md:text-left">
                  <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
                    <span className="px-2 py-1 bg-metal-fire/10 text-metal-fire text-[10px] font-bold rounded uppercase tracking-wider border border-metal-fire/30 w-fit">
                      ⚔️ Maîtrise de Classe
                    </span>
                    <span className="text-xs text-gray-500 italic">
                      Augmente uniquement via ton bonus de classe
                    </span>
                  </div>

                  <h3 className="font-metal text-xl sm:text-3xl mb-1" style={{ color: classMeta.color }}>
                    {classMeta.name}
                  </h3>

                  <p
                    className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 inline-block px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: `${classMeta.color}15`,
                      borderColor: classMeta.color,
                      color: classMeta.color,
                    }}
                  >
                    🏆 {getClassTitle(classMeta.id, classProgress.currentLevel)}
                  </p>

                  <div className="max-w-md mx-auto md:mx-0">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="font-semibold text-gray-300">Niveau {classProgress.currentLevel}</span>
                      <span>
                        {classProgress.nextLevelXp === Infinity
                          ? 'MAX'
                          : `${classProgress.nextLevelXp.toLocaleString('fr-FR')} XP`}
                      </span>
                    </div>
                    <div
                      className="h-3 bg-metal-gray rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(classProgress.progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progression vers le niveau ${classProgress.currentLevel + 1}`}
                    >
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

                  <div className="mt-3 sm:mt-4 text-xs text-gray-400 bg-metal-black/50 p-2 sm:p-3 rounded-lg border border-metal-gray/50">
                    ✨ <span className="text-gray-200 font-semibold">Bonus actif :</span>{' '}
                    <span className="text-metal-fire font-bold">
                      +{Math.round((classMeta.bonus.multiplier - 1) * 100)}% XP
                    </span>{' '}
                    {getBonusDescription(classMeta.bonus.type, classMeta.bonus.threshold)}
                  </div>
                </div>

                <button
                  onClick={() => setIsClassModalOpen(true)}
                  className="shrink-0 px-4 py-2 text-sm text-gray-400 hover:text-metal-fire border border-metal-gray hover:border-metal-fire rounded-lg transition-all bg-metal-black/30 focus:outline-none focus:ring-2 focus:ring-metal-fire/50 w-full md:w-auto"
                  aria-label="Changer de classe de personnage"
                >
                  Changer de voie
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl sm:text-6xl opacity-30 shrink-0" aria-hidden="true">⚔️</div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-metal text-lg sm:text-2xl text-gray-400 mb-2">Aucune classe choisie</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 max-w-md">
                    Le Conseil des Neuf Genres t'attend. Choisis ta destinée pour débloquer des bonus d'XP uniques et des quêtes spéciales.
                  </p>
                  <button
                    onClick={() => setIsClassModalOpen(true)}
                    className="px-6 py-2 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 focus:outline-none focus:ring-2 focus:ring-metal-fire/50"
                  >
                    Choisir ma classe
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-metal-fire/5 border border-metal-fire/20 rounded-lg p-3 sm:p-4 flex gap-3 items-start">
          <span className="text-lg sm:text-2xl shrink-0" aria-hidden="true">💡</span>
          <div className="text-xs sm:text-sm text-gray-300">
            <p className="font-bold text-metal-fire mb-1">Système de Double Progression :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>
                <span className="text-gray-200">Progression Globale</span> : Monte avec{' '}
                <strong>toutes</strong> tes actions (vues, favoris, reviews).
              </li>
              <li>
                <span className="text-gray-200">Maîtrise de Classe</span> : Monte{' '}
                <strong>uniquement</strong> via ton bonus de classe spécifique.
              </li>
            </ul>
          </div>
        </div>

        {selectedClass && <ClassMilestones />}
      </section>

      {/* Chapitre III : Exploits */}
      <section id="exploits" aria-labelledby="exploits-title" className="scroll-mt-24 space-y-3 sm:space-y-4">
        <ChapterDivider number="III" title="Tes Exploits" />
        <div className="text-center">
          <h2 id="exploits-title" className="font-metal text-xl sm:text-3xl text-metal-fire mb-2 sm:mb-3">
            🏛️ Maîtrises des classes
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
            Chaque acte des destinées est récompensé et gravé à jamais dans le Metalverse
          </p>
        </div>
        <PantheonSection />
        <div className="text-center mt-6">
          <h2 className="font-metal text-xl sm:text-3xl text-metal-fire mb-2 sm:mb-3">
            🏆 Titres honorifiques
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
            Le Conseil des Neuf Genres honore tes exploits
          </p>
        </div>
        <TimelineBadgesPanel />
      </section>

      {/* Chapitre IV : Découvertes */}
      <section id="decouvertes" aria-labelledby="decouvertes-title" className="scroll-mt-24 space-y-3">
        <ChapterDivider number="IV" title="Tes Découvertes" />
        <div className="text-center">
          <h2 id="decouvertes-title" className="font-metal text-xl sm:text-3xl text-metal-fire mb-2 sm:mb-3">
            📜 Tables du Savoir
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
            Collecte les fragments dans le Codex des Anciens pour compléter les 9 Tables du Savoir
          </p>
        </div>
        <div className="relative p-3 sm:p-5 overflow-hidden rounded-xl bg-metal-black/20 border border-metal-gray/30">
          <FloatingRunes preset="parchment" />
          <div className="relative z-10">
            <TableOfKnowledge />
          </div>
        </div>
      </section>

      {/* Chapitre V : La Forge */}
      <section id="forge" aria-labelledby="forge-title" className="scroll-mt-24 space-y-3">
        <ChapterDivider number="V" title="La Forge" />
        <div className="text-center">
          <h2 id="forge-title" className="font-metal text-xl sm:text-3xl text-metal-fire mb-2 sm:mb-3">
            🔥 Forge ton emblème
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
            Utilise l'IA pour créer le logo officiel de ton groupe de metal idéal
          </p>
        </div>
        <div className="relative p-3 sm:p-5 overflow-hidden rounded-xl bg-metal-black/20 border border-metal-gray/30">
          <FloatingRunes preset="parchment" />
          <div className="relative z-10">
            <AILogoGenerator />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          MODALES
      ═══════════════════════════════════════════════════════════ */}
      <ClassSelectionModal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} />
      
      {/* ✅ NOUVEAU : Rendu de la modale du Grimoire */}
      <LoreGrimoire isOpen={isGrimoireOpen} onClose={() => setIsGrimoireOpen(false)} />
    </div>
  );
}
