import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './notificationStore';

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
// MÉTADONNÉES DES TABLES DU SAVOIR
// ═══════════════════════════════════════════════════════════
// Chaque Table correspond à un pilier et contient les IDs
// des fragments qui la composent.
const TABLES: Record<string, number[]> = {
  'Heavy Metal':        [1, 2, 3, 4, 5, 6, 7],
  'Thrash Metal':       [8, 9, 10, 11, 12, 47, 48, 49, 50, 70, 71],
  'Death Metal':        [13, 14, 15, 16, 43, 44, 45, 51, 52, 72, 73],
  'Black Metal':        [17, 18, 19, 20, 21, 54, 55, 56, 74, 75],
  'Power Metal':        [22, 23, 24, 25, 57, 58, 59, 76, 77],
  'Doom Metal':         [36, 37, 38, 39, 60, 78, 79],
  'Progressive Metal':  [31, 32, 33, 62, 63, 64, 82, 83],
  'Folk Metal':         [40, 41, 42, 61, 80, 81, 86],
  'Metalcore':          [26, 27, 28, 29, 30, 65, 66, 67, 84, 85],
};

// Icônes par pilier pour la célébration
const PILLAR_ICONS: Record<string, string> = {
  'Heavy Metal':        '🎸',
  'Thrash Metal':       '⚡',
  'Death Metal':        '🩸',
  'Black Metal':        '💀',
  'Power Metal':        '🔥',
  'Doom Metal':         '🧟',
  'Progressive Metal':  '🌀',
  'Folk Metal':         '🍀',
  'Metalcore':          '💥',
};

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
  for (const [pillar, ids] of Object.entries(TABLES)) {
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
        const allTablesComplete = Object.values(TABLES).every((tableIds) =>
          tableIds.every((id) => collectedIds.includes(id))
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
            icon: PILLAR_ICONS[pillar] || '📜',
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

          // ✅ Vérifier si une Table vient d'être complétée
          checkTableCompletion(newIds, previousIds, id);

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
