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

interface FragmentState {
  collectedIds: number[];
  isLoadingCloud: boolean;

  loadFromCloud: () => Promise<void>;
  collectFragment: (id: number) => Promise<boolean>;
  isCollected: (id: number) => boolean;
  clearAll: () => void; // ✅ NOUVEAU : Pour vider le state local à la déconnexion
  resetProgress: () => Promise<void>;
  _syncFragmentsToCloud: () => Promise<void>;
}

function checkTableCompletion(collectedIds: number[], previousIds: number[], newId: number) {
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

export const useFragmentStore = create<FragmentState>()(
  persist(
    (set, get) => ({
      collectedIds: [],
      isLoadingCloud: false,

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
              const mergedIds = Array.from(new Set([...state.collectedIds, ...cloudIds]));
              return { collectedIds: mergedIds, isLoadingCloud: false };
            });

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

      collectFragment: async (id) => {
        const previousIds = get().collectedIds;
        const isAlreadyCollected = previousIds.includes(id);

        if (!isAlreadyCollected) {
          const newIds = [...previousIds, id];
          set({ collectedIds: newIds });
          checkTableCompletion(newIds, previousIds, id);
          setTimeout(() => {
            useAchievementStore.getState().checkTimelineAchievements(newIds);
          }, 100);
          await get()._syncFragmentsToCloud();
          return true;
        }
        return false;
      },

      isCollected: (id) => get().collectedIds.includes(id),

      // ✅ NOUVEAU : Vide uniquement le state local (pour la déconnexion)
      clearAll: () => {
        set({ collectedIds: [] });
      },

      resetProgress: async () => {
        set({ collectedIds: [] });
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
          if (typeof window === 'undefined') return null;
          try {
            const value = await idbGet(name, idbStore);
            return value ? JSON.parse(value) : null;
          } catch { return null; }
        },
        setItem: async (name, value) => {
          if (typeof window === 'undefined') return;
          try { await idbSet(name, JSON.stringify(value), idbStore); }
          catch (err) { console.error('Failed to persist fragments:', err); }
        },
        removeItem: async (name) => {
          if (typeof window === 'undefined') return;
          try { await idbDel(name, idbStore); }
          catch (err) { console.error('Failed to remove fragments:', err); }
        },
      })),
      onRehydrateStorage: () => (state) => {
        if (state) { /* loadFromCloud gérera l'état final */ }
      },
    }
  )
);

export const useCollectedFragments = () => useFragmentStore((s) => s.collectedIds);
export const useFragmentCount = () => useFragmentStore((s) => s.collectedIds.length);
export const useFragmentIsLoading = () => useFragmentStore((s) => s.isLoadingCloud);
