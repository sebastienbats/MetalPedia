import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/api/authApi';
import { offlineSync } from '@/lib/offline-sync';
import { useNotificationStore } from './notificationStore';
import { useAchievementStore } from './achievementStore';
import { TIMELINE_TABLES } from '@/lib/gamification/timeline-badges';

const idbStore = createStore('metalpedia-fragments', 'keyval');

// ═══════════════════════════════════════════════════════════
// INTERFACE DU STORE
// ═══════════════════════════════════════════════════════════
interface FragmentState {
  collectedIds: number[];
  isLoadingCloud: boolean; // ✅ NOUVEAU

  // Actions
  loadFromCloud: () => Promise<void>; // ✅ NOUVEAU
  collectFragment: (id: number) => Promise<boolean>; // ✅ Rendu async
  isCollected: (id: number) => boolean;
  _syncFragmentsToCloud: () => Promise<void>; // ✅ NOUVEAU
  resetProgress: () => Promise<void>; // ✅ Rendu async
}

// ═══════════════════════════════════════════════════════════
// HELPER : Détection de Table complète (Inchangé, c'est parfait !)
// ═══════════════════════════════════════════════════════════
function checkTableCompletion(
  collectedIds: number[],
  previousIds: number[],
  newId: number
) {
  for (const [pillar, table] of Object.entries(TIMELINE_TABLES)) {
    const ids = table.ids;
    
    if (!ids.includes(newId)) continue;

    const wasComplete = ids.every((id) => previousIds.includes(id));
    const isNowComplete = ids.every((id) => collectedIds.includes(id));

    if (!wasComplete && isNowComplete) {
      setTimeout(() => {
        const allTablesComplete = Object.values(TIMELINE_TABLES).every((t) =>
          t.ids.every((id) => collectedIds.includes(id))
        );

        if (allTablesComplete) {
          useNotificationStore.getState().triggerCelebration({
            type: 'all_tables',
            icon: '👑',
            title: 'Grand Sage du Metalverse',
            subtitle: 'Tu as gravé les 85 fragments. Les Neuf Genres te couronnent. Ta légende est éternelle.',
            fragmentsCollected: collectedIds.length,
          });
        } else {
          useNotificationStore.getState().triggerCelebration({
            type: 'table_complete',
            pillar,
            icon: table.icon || '📜',
            title: `Table du ${pillar} Complète !`,
            subtitle: 'Les Anciens gravent ton nom dans la Légende du Metalverse.',
            fragmentsCollected: ids.length,
          });
        }
      }, 800);

      break;
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
      isLoadingCloud: false,

      // ✅ 1. CHARGEMENT DEPUIS LE CLOUD
      loadFromCloud: async () => {
        const user = await getCurrentUser();
        if (!user) {
          set({ isLoadingCloud: false });
          return;
        }

        set({ isLoadingCloud: true });
        try {
          const { data, error } = await supabase
            .from('user_fragments')
            .select('fragment_id')
            .eq('user_id', user.id);

          if (error) throw error;

          if (data) {
            const cloudIds = data.map((row) => row.fragment_id);
            set((state) => {
              // Fusion avec l'existant (pour préserver les collectes hors ligne)
              const mergedIds = Array.from(new Set([...state.collectedIds, ...cloudIds]));
              return { collectedIds: mergedIds, isLoadingCloud: false };
            });

            // Si on charge des fragments du cloud, on vérifie aussi les succès
            if (cloudIds.length > 0) {
              setTimeout(() => {
                useAchievementStore.getState().checkTimelineAchievements(get().collectedIds);
              }, 100);
            }
          } else {
            set({ isLoadingCloud: false });
          }
        } catch (error) {
          console.error('Erreur chargement fragments cloud:', error);
          set({ isLoadingCloud: false });
        }
      },

      // ✅ 2. HELPER DE SYNCHRONISATION
      _syncFragmentsToCloud: async () => {
        const user = await getCurrentUser();
        if (!user) return;

        const currentIds = get().collectedIds;
        if (offlineSync.isCurrentlyOnline()) {
          const payload = currentIds.map((id) => ({
            user_id: user.id,
            fragment_id: id,
          }));

          const { error } = await supabase.from('user_fragments').upsert(payload, {
            onConflict: 'user_id, fragment_id',
          });

          if (error) console.error('Échec sync fragments:', error);
        } else {
          offlineSync.addPendingOperation({
            type: 'fragments_sync',
            payload: currentIds,
          });
        }
      },

      // ✅ 3. ACTION AVEC MISE À JOUR OPTIMISTE + CÉLÉBRATION
      collectFragment: async (id) => {
        const previousIds = get().collectedIds;
        const isAlreadyCollected = previousIds.includes(id);

        if (!isAlreadyCollected) {
          const newIds = [...previousIds, id];
          
          // A. Mise à jour locale immédiate
          set({ collectedIds: newIds });

          // B. Vérifier si une Table vient d'être complétée
          checkTableCompletion(newIds, previousIds, id);

          // C. Vérifier les succès Timeline (badges)
          setTimeout(() => {
            useAchievementStore.getState().checkTimelineAchievements(newIds);
          }, 100);

          // D. Synchronisation en arrière-plan
          await get()._syncFragmentsToCloud();

          return true;
        }

        return false;
      },

      isCollected: (id) => get().collectedIds.includes(id),

      resetProgress: async () => {
        // A. Mise à jour locale immédiate
        set({ collectedIds: [] });
        
        // B. Nettoyer aussi côté cloud si l'utilisateur est connecté
        const user = await getCurrentUser();
        if (user) {
          await supabase.from('user_fragments').delete().eq('user_id', user.id);
        }
      },
    }),
    {
      name: 'metalverse-fragments-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          // 🛡️ SSR Guard : Si on est sur le serveur, on ne touche pas à IndexedDB
          if (typeof window === 'undefined') return null;
          try {
            const value = await idbGet(name, idbStore);
            return value ? JSON.parse(value) : null;
          } catch { return null; }
        },
        setItem: async (name, value) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try { await idbSet(name, JSON.stringify(value), idbStore); }
          catch (err) { console.error('Failed to persist fragments:', err); }
        },
        removeItem: async (name) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try { await idbDel(name, idbStore); }
          catch (err) { console.error('Failed to remove fragments:', err); }
        },
      })),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // On ne met pas hydrated: true ici car loadFromCloud gérera l'état final
        }
      },
    }
  )
);

// ═══════════════════════════════════════════════════════════
// HOOKS SÉLECTEURS
// ═══════════════════════════════════════════════════════════
export const useCollectedFragments = () =>
  useFragmentStore((s) => s.collectedIds);

export const useFragmentCount = () =>
  useFragmentStore((s) => s.collectedIds.length);

export const useFragmentIsLoading = () =>
  useFragmentStore((s) => s.isLoadingCloud);
