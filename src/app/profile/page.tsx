'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/api/authApi';
import { useClassStore, useClassMetadata, useClassProgress } from '@/stores/classStore';
import { getClassTitle } from '@/lib/gamification/classes';
import ClassSelectionModal from '@/components/gamification/ClassSelectionModal';
import ClassMilestones from '@/components/gamification/ClassMilestones';
import PantheonSection from '@/components/gamification/PantheonSection';
import PlayerCard from '@/components/gamification/PlayerCard';
import BadgesPanel from '@/components/gamification/BadgesPanel';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import TableOfKnowledge from '@/components/timeline/TableOfKnowledge';
import LoreGrimoire from '@/components/gamification/LoreGrimoire';
import FloatingRunes from '@/components/ui/FloatingRunes';
import StatsPanel from '@/components/visual/StatsPanel';

// ═══════════════════════════════════════════════════════════
// HELPER : Description du bonus de classe
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { data: user } = useAuth();
  const { selectedClass } = useClassStore();
  const classMeta = useClassMetadata();
  const classProgress = useClassProgress();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-10 pb-12">
      {/* ═══════════════════════════════════════════════════════════
          1. EN-TÊTE PRINCIPAL
      ═══════════════════════════════════════════════════════════ */}
      <header className="text-center">
        <h1 className="font-metal text-4xl md:text-5xl text-metal-rust mb-2">
          ⚔️ Ta Légende
        </h1>
        <p className="text-gray-400 font-serif text-lg">
          Le Conseil des Neuf Genres observe ta progression
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          2. SECTION CLASSE DE PERSONNAGE
      ═══════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="class-section-title"
        className="metal-card p-6 border-2 border-metal-gray relative overflow-hidden"
      >
        {classMeta && (
          <div
            className="absolute -top-10 -right-10 w-64 h-64 opacity-10 pointer-events-none rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${classMeta.color} 0%, transparent 70%)` }}
            aria-hidden="true"
          />
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {classMeta && classProgress ? (
            <>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl border-4 shadow-lg shrink-0 transition-transform hover:scale-105"
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
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
                  <span className="px-2 py-1 bg-metal-fire/10 text-metal-fire text-[10px] font-bold rounded uppercase tracking-wider border border-metal-fire/30">
                    ⚔️ Maîtrise de Classe
                  </span>
                  <span className="text-xs text-gray-500 italic">
                    Augmente uniquement via ton bonus de classe
                  </span>
                </div>

                <h2
                  id="class-section-title"
                  className="font-metal text-3xl mb-1"
                  style={{ color: classMeta.color }}
                >
                  {classMeta.name}
                </h2>

                <p
                  className="text-sm font-semibold mb-4 inline-block px-3 py-1 rounded-full border"
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

                <div className="mt-4 text-xs text-gray-400 bg-metal-black/50 p-3 rounded-lg border border-metal-gray/50 inline-block">
                  ✨ <span className="text-gray-200 font-semibold">Bonus actif :</span>{' '}
                  <span className="text-metal-fire font-bold">
                    +{Math.round((classMeta.bonus.multiplier - 1) * 100)}% XP
                  </span>{' '}
                  {getBonusDescription(classMeta.bonus.type, classMeta.bonus.threshold)}
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="shrink-0 px-4 py-2 text-sm text-gray-400 hover:text-metal-fire border border-metal-gray hover:border-metal-fire rounded-lg transition-all bg-metal-black/30 focus:outline-none focus:ring-2 focus:ring-metal-fire/50"
                aria-label="Changer de classe de personnage"
              >
                Changer de voie
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl opacity-30 shrink-0" aria-hidden="true">⚔️</div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-metal text-2xl text-gray-400 mb-2">Aucune classe choisie</h2>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  Le Conseil des Neuf Genres t'attend. Choisis ta destinée pour débloquer des bonus
                  d'XP uniques et des quêtes spéciales.
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
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. BOÎTE D'INFO : DOUBLE PROGRESSION
      ═══════════════════════════════════════════════════════════ */}
      <section aria-label="Explication du système de progression" className="max-w-2xl mx-auto">
        <div className="bg-metal-fire/5 border border-metal-fire/20 rounded-lg p-4 text-left flex gap-3 items-start">
          <span className="text-2xl shrink-0" aria-hidden="true">💡</span>
          <div className="text-sm text-gray-300">
            <p className="font-bold text-metal-fire mb-1">Système de Double Progression :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>
                <span className="text-gray-200">Progression Globale</span> : Monte avec{' '}
                <strong>toutes</strong> tes actions (vues, favoris, reviews).
              </li>
              <li>
                <span className="text-gray-200">Maîtrise de Classe</span> : Monte{' '}
                <strong>uniquement</strong> lorsque tu déclenches ton bonus de classe spécifique (ex:
                explorer des groupes obscurs pour le Nécromancien).
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. VOIE DE L'ASCENSION
      ═══════════════════════════════════════════════════════════ */}
      {selectedClass && <ClassMilestones />}

      {/* ═══════════════════════════════════════════════════════════
          5. PANTHÉON DES ANCIENS
      ═══════════════════════════════════════════════════════════ */}
      <PantheonSection />

      {/* ═══════════════════════════════════════════════════════════
          6. GRILLE PRINCIPALE
      ═══════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════
          7. TABLE DU SAVOIR (Visualisation des 85 fragments)
      ═══════════════════════════════════════════════════════════ */}
      <section aria-labelledby="table-title" className="text-center">
        <h2 id="table-title" className="font-metal text-3xl md:text-4xl text-metal-rust mb-4">
          📜 La Table du Savoir
        </h2>
        <p className="text-gray-400 font-serif mb-6">
          Les 85 fragments du Metalverse que tu as gravés dans ta mémoire en explorant la Timeline
        </p>

        <div className="relative p-6 md:p-8 overflow-hidden rounded-xl bg-metal-black/20 border border-metal-gray/30">
          <FloatingRunes preset="parchment" />
          <div className="relative z-10">
            <TableOfKnowledge />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. GRIMOIRE DU LORE (Section immersive)
      ═══════════════════════════════════════════════════════════ */}
      <section aria-labelledby="grimoire-title" className="text-center">
        <h2 id="grimoire-title" className="font-metal text-3xl md:text-4xl text-metal-rust mb-4">
          🪶 Le Grimoire du Metalverse
        </h2>
        <p className="text-gray-400 font-serif mb-6">
          Les récits et légendes que tu as découverts au fil de tes explorations
        </p>

        <div className="relative p-6 md:p-8 overflow-hidden rounded-xl bg-metal-black/20 border border-metal-gray/30">
          <FloatingRunes preset="parchment" />
          <div className="relative z-10">
            <LoreGrimoire />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          9. BANNIÈRE DE CONNEXION (Si non connecté)
      ═══════════════════════════════════════════════════════════ */}
      {!user && (
        <section
          aria-label="Invitation à créer un compte"
          className="metal-card p-6 border-2 border-metal-fire/50 bg-gradient-to-r from-metal-fire/10 to-transparent"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-5xl shrink-0" aria-hidden="true">🔐</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-metal-fire mb-2">
                Sauvegarde ta progression dans le cloud
              </h2>
              <p className="text-gray-300 text-sm">
                Crée un compte pour synchroniser ton XP, tes badges, ta classe et tes favoris sur
                tous tes appareils. Actuellement, tes données sont sauvegardées localement dans ton
                navigateur.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-6 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-metal-fire/50"
            >
              Se connecter
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL DE SÉLECTION DE CLASSE
      ═══════════════════════════════════════════════════════════ */}
      <ClassSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
