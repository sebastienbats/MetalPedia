'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/api/authApi';
import { useClassStore, useClassMetadata, useClassProgress } from '@/stores/classStore';
import { useAchievementStore } from '@/stores/achievementStore';
import { useFragmentStore } from '@/stores/fragmentStore';
import { getClassTitle } from '@/lib/gamification/classes';
import ClassSelectionModal from '@/components/gamification/ClassSelectionModal';
import ClassMilestones from '@/components/gamification/ClassMilestones';
import PantheonSection from '@/components/gamification/PantheonSection';
import PlayerCard from '@/components/gamification/PlayerCard';
import BadgesPanel from '@/components/gamification/BadgesPanel';
import TimelineBadgesPanel from '@/components/gamification/TimelineBadgesPanel';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import TableOfKnowledge from '@/components/timeline/TableOfKnowledge';
import LoreGrimoire from '@/components/gamification/LoreGrimoire';
import FloatingRunes from '@/components/ui/FloatingRunes';
import StatsPanel from '@/components/visual/StatsPanel';

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
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Navigation des chapitres"
      className="sticky top-2 z-30 -mx-4 px-4 sm:mx-0 sm:px-0"
    >
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
    <div className="flex items-center gap-4 my-8 sm:my-10" aria-hidden="true">
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const collectedIds = useFragmentStore.getState().collectedIds;
    if (collectedIds.length > 0) {
      useAchievementStore.getState().checkTimelineAchievements(collectedIds);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16 space-y-12">
      <header className="text-center">
        <h1 className="font-metal text-2xl lg:text-4xl text-metal-fire mb-8">
          ⚔️ Ta Légende
        </h1>
        <p className="text-metal-bone font-serif text-base lg:text-lg">
          Le Conseil des Neuf Genres observe ta progression
        </p>
      </header>

      <ChapterNav />

      <section id="origines" aria-labelledby="origines-title" className="scroll-mt-24 space-y-4">
        <ChapterDivider number="I" title="Les Origines" />
        <div className="text-center">
          <h2
            id="origines-title"
            className="font-metal text-xl lg:text-3xl text-metal-fire mb-4"
          >
            🪶 Le Grimoire du Metalverse
          </h2>
          <p className="text-metal-bone font-serif text-base lg:text-lg mb-6">
            Les récits fondateurs du monde que tu explores — à lire avant de choisir ta voie
          </p>
        </div>

        <div className="relative p-6 lg:p-8 overflow-hidden rounded-xl bg-metal-black/20 border border-metal-gray/30">
          <FloatingRunes preset="parchment" />
          <div className="relative z-10">
            <LoreGrimoire />
          </div>
        </div>
      </section>

      <section id="incarnation" aria-labelledby="incarnation-title" className="scroll-mt-24 space-y-6">
        <ChapterDivider number="II" title="Ton Incarnation" />
        <h2 id="incarnation-title" className="sr-only">
          Ton Incarnation
        </h2>

        <div className="metal-card p-6 lg:p-8 border-2 border-metal-gray relative overflow-hidden">
          {classMeta && (
            <div
              className="absolute -top-10 -right-10 w-64 h-64 opacity-10 pointer-events-none rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${classMeta.color} 0%, transparent 70%)` }}
              aria-hidden="true"
            />
          )}

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 sm:gap-6">
            {classMeta && classProgress ? (
              <>
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl sm:text-5xl border-4 shadow-lg shrink-0 transition-transform hover:scale-105"
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

                  <h3
                    className="font-metal text-2xl sm:text-3xl mb-1"
                    style={{ color: classMeta.color }}
                  >
                    {classMeta.name}
                  </h3>

                  <p
                    className="text-xs sm:text-sm font-semibold mb-4 inline-block px-3 py-1 rounded-full border"
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
                      <span className="font-semibold text-gray-300">
                        Niveau {classProgress.currentLevel}
                      </span>
                      <span>
                        {classProgress.nextLevelXp === Infinity
                          ? 'MAX'
                          : `${classProgress.nextLevelXp.toLocaleString()} XP`}
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

                  <div className="mt-4 text-xs text-gray-400 bg-metal-black/50 p-3 rounded-lg border border-metal-gray/50">
                    ✨ <span className="text-gray-200 font-semibold">Bonus actif :</span>{' '}
                    <span className="text-metal-fire font-bold">
                      +{Math.round((classMeta.bonus.multiplier - 1) * 100)}% XP
                    </span>{' '}
                    {getBonusDescription(classMeta.bonus.type, classMeta.bonus.threshold)}
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="shrink-0 px-4 py-2 text-sm text-gray-400 hover:text-metal-fire border border-metal-gray hover:border-metal-fire rounded-lg transition-all bg-metal-black/30 focus:outline-none focus:ring-2 focus:ring-metal-fire/50 w-full md:w-auto"
                  aria-label="Changer de classe de personnage"
                >
                  Changer de voie
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl sm:text-6xl opacity-30 shrink-0" aria-hidden="true">
                  ⚔️
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-metal text-xl sm:text-2xl text-gray-400 mb-2">
                    Aucune classe choisie
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md">
                    Le Conseil des Neuf Genres t'attend. Choisis ta destinée pour débloquer des
                    bonus d'XP uniques et des quêtes spéciales.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 focus:outline-none focus:ring-2 focus:ring-metal-fire/50"
                  >
                    Choisir ma classe
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-metal-fire/5 border border-metal-fire/20 rounded-lg p-4 flex gap-3 items-start">
          <span className="text-xl sm:text-2xl shrink-0" aria-hidden="true">
            💡
          </span>
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

      <section id="exploits" aria-labelledby="exploits-title" className="scroll-mt-24 space-y-6">
        <ChapterDivider number="III" title="Tes Exploits" />
        <h2 id="exploits-title" className="sr-only">
          Tes Exploits
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <PlayerCard />
          <StatsPanel />
        </div>

        <PantheonSection />

        <TimelineBadgesPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <QuestsPanel />
          <BadgesPanel />
        </div>
      </section>

      <section id="decouvertes" aria-labelledby="decouvertes-title" className="scroll-mt-24 space-y-4">
        <ChapterDivider number="IV" title="Tes Découvertes" />
        <div className="relative p-6 lg:p-8 overflow-hidden rounded-xl bg-metal-black/20 border border-metal-gray/30">
          <FloatingRunes preset="parchment" />
          <div className="relative z-10">
            <TableOfKnowledge />
          </div>
        </div>
      </section>

      {!user && (
        <section
          aria-label="Invitation à créer un compte"
          className="metal-card p-6 lg:p-8 border-2 border-metal-fire/50 bg-gradient-to-r from-metal-fire/10 to-transparent"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="text-4xl sm:text-5xl shrink-0" aria-hidden="true">
              🔐
            </div>
            <div className="flex-1">
              <h2 className="font-metal text-xl lg:text-3xl text-metal-fire mb-2">
                Sauvegarde ta progression dans le cloud
              </h2>
              <p className="text-metal-bone font-serif text-sm lg:text-base">
                Crée un compte pour synchroniser ton XP, tes badges, ta classe et tes favoris sur
                tous tes appareils. Actuellement, tes données sont sauvegardées localement.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-6 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-metal-fire/50 w-full sm:w-auto text-center"
            >
              Se connecter
            </Link>
          </div>
        </section>
      )}

      <ClassSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
