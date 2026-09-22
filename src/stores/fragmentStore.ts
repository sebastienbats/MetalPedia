import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './notificationStore';
import { useAchievementStore } from './achievementStore'; // 🆕 Import pour les succès
import { TIMELINE_TABLES } from '@/lib/gamification/timeline-badges'; // 🆕 Tables centralisées

// ═══════════════════════════════════════════════════════════
// INTERFACE DU STORE
// ═══════════════════════════════════════════════════════════
interface FragmentState {
  collectedIds: number[];
  collectFragment: (id: number) => boolean; // Retourne true si c'est une nouvelle collecte
  isCollected: (id: number) => boolean;
  resetProgress: () => void; // Utile pour tester ou reset le compte
}

// ═══════════════════════════════════════════════════════════
// HELPER : Détection de Table complète
// ═══════════════════════════════════════════════════════════
// Appelée APRÈS chaque nouvelle collecte pour vérifier
// si une Table vient d'être complétée.
function checkTableCompletion(
  collectedIds: number[],
  previousIds: number[],
  newId: number
) {
  for (const [pillar, table] of Object.entries(TIMELINE_TABLES)) {
    const ids = table.ids;
    
    // Vérifier si ce fragment appartient à cette Table
    if (!ids.includes(newId)) continue;

    // Table était-elle complète AVANT ?
    const wasComplete = ids.every((id) => previousIds.includes(id));
    // Table est-elle complète MAINTENANT ?
    const isNowComplete = ids.every((id) => collectedIds.includes(id));

    if (!wasComplete && isNowComplete) {
      // 🎉 Table complète ! Déclencher la célébration
      // avec un délai pour laisser le toast du fragment s'afficher
      setTimeout(() => {
        // Vérifier si TOUTES les tables sont complètes (Grand Sage)
        const allTablesComplete = Object.values(TIMELINE_TABLES).every((t) =>
          t.ids.every((id) => collectedIds.includes(id))
        );

        if (allTablesComplete) {
          // 🏆 Célébration ultime : toutes les Tables complètes
          useNotificationStore.getState().triggerCelebration({
            type: 'all_tables',
            icon: '👑',
            title: 'Grand Sage du Metalverse',
            subtitle:
              'Tu as gravé les 85 fragments. Les Neuf Genres te couronnent. Ta légende est éternelle.',
            fragmentsCollected: collectedIds.length,
          });
        } else {
          // 🏆 Célébration de Table
          useNotificationStore.getState().triggerCelebration({
            type: 'table_complete',
            pillar,
            icon: table.icon || '📜',
            title: `Table du ${pillar} Complète !`,
            subtitle:
              'Les Anciens gravent ton nom dans la Légende du Metalverse.',
            fragmentsCollected: ids.length,
          });
        }
      }, 800);

      break; // Une seule Table peut être complétée à la fois
    }
  }
}

// ═══════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════
export const useFragmentStore = create<FragmentState>()(
  persist(
    (set, get) => ({
      collectedIds: [],

      collectFragment: (id) => {
        const previousIds = get().collectedIds;
        const isAlreadyCollected = previousIds.includes(id);

        if (!isAlreadyCollected) {
          const newIds = [...previousIds, id];
          set({ collectedIds: newIds });

          // ✅ Vérifier si une Table vient d'être complétée (célébration)
          checkTableCompletion(newIds, previousIds, id);

          // 🆕 Vérifier les succès Timeline (badges)
          // Délai pour laisser la célébration s'afficher en premier
          setTimeout(() => {
            useAchievementStore.getState().checkTimelineAchievements(newIds);
          }, 100);

          return true; // Nouvelle collecte !
        }

        return false; // Déjà collecté
      },

      isCollected: (id) => get().collectedIds.includes(id),

      resetProgress: () => set({ collectedIds: [] }),
    }),
    {
      name: 'metalverse-fragments-storage', // Clé dans le localStorage
    }
  )
);
