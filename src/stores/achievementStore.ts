import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/api/authApi';
import { offlineSync } from '@/lib/offline-sync';
import { TIMELINE_BADGES } from '@/lib/gamification/timeline-badges';
import { useNotificationStore } from './notificationStore';

const idbStore = createStore('metalpedia-achievements', 'keyval');

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface UnlockedBadge {
  id: string;
  unlockedAt: number; // timestamp
}

interface AchievementState {
  unlockedBadges: UnlockedBadge[];
  hydrated: boolean;
  isLoadingCloud: boolean; // ✅ NOUVEAU

  // Actions
  loadFromCloud: () => Promise<void>; // ✅ NOUVEAU
  unlockBadge: (id: string) => Promise<boolean>; // ✅ Rendu async pour la sync
  isUnlocked: (id: string) => boolean;
  getUnlockedAt: (id: string) => number | null;
  checkTimelineAchievements: (collectedIds: number[]) => void;
  _syncAchievementsToCloud: () => Promise<void>; // ✅ NOUVEAU
  setHydrated: () => void;
  resetAchievements: () => void;
}

// ═══════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════
export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedBadges: [],
      hydrated: false,
      isLoadingCloud: false,

      setHydrated: () => set({ hydrated: true }),

      // ✅ 1. CHARGEMENT DEPUIS LE CLOUD
      loadFromCloud: async () => {
        const user = await getCurrentUser();
        if (!user) {
          set({ isLoadingCloud: false, hydrated: true });
          return;
        }

        set({ isLoadingCloud: true });
        try {
          const { data, error } = await supabase
            .from('user_achievements')
            .select('badge_id, unlocked_at')
            .eq('user_id', user.id);

          if (error) throw error;

          if (data) {
            const cloudBadges: UnlockedBadge[] = data.map((row) => ({
              id: row.badge_id,
              // ✅ CORRECTION : Filet de sécurité si unlocked_at est null
              unlockedAt: row.unlocked_at ? new Date(row.unlocked_at).getTime() : Date.now(),
            }));

            // Fusion avec l'existant (pour préserver les déblocages hors ligne)
            set((state) => {
              const mergedBadges = [...state.unlockedBadges];
              cloudBadges.forEach((cb) => {
                if (!mergedBadges.some((b) => b.id === cb.id)) {
                  mergedBadges.push(cb);
                }
              });
              return { 
                unlockedBadges: mergedBadges, 
                isLoadingCloud: false, 
                hydrated: true 
              };
            });
          } else {
            set({ isLoadingCloud: false, hydrated: true });
          }
        } catch (error) {
          console.error('Erreur chargement achievements cloud:', error);
          set({ isLoadingCloud: false, hydrated: true });
        }
      },

      // ✅ 2. HELPER DE SYNCHRONISATION
      _syncAchievementsToCloud: async () => {
        const user = await getCurrentUser();
        if (!user) return;

        const currentBadges = get().unlockedBadges;
        if (offlineSync.isCurrentlyOnline()) {
          const payload = currentBadges.map((b) => ({
            user_id: user.id,
            badge_id: b.id,
            unlocked_at: new Date(b.unlockedAt).toISOString(),
          }));

          const { error } = await supabase.from('user_achievements').upsert(payload, {
            onConflict: 'user_id, badge_id',
          });

          if (error) console.error('Échec sync achievements:', error);
        } else {
          offlineSync.addPendingOperation({
            type: 'achievements_sync',
            payload: currentBadges,
          });
        }
      },

      // ✅ 3. ACTION AVEC MISE À JOUR OPTIMISTE + NOTIFICATION
      unlockBadge: async (id) => {
        const badge = TIMELINE_BADGES.find((b) => b.id === id);
        if (!badge) return false;

        const alreadyUnlocked = get().unlockedBadges.some((b) => b.id === id);
        if (alreadyUnlocked) return false;

        const newUnlocked: UnlockedBadge = { id, unlockedAt: Date.now() };

        // A. Mise à jour locale immédiate
        set((state) => ({
          unlockedBadges: [...state.unlockedBadges, newUnlocked],
        }));

        // B. Notification toast (inchangée, c'est parfait)
        useNotificationStore.getState().pushNotification({
          type: 'badge',
          rarity: badge.rarity,
          icon: badge.icon,
          title: `${badge.title} débloqué !`,
          description: badge.description,
          duration: 6000,
        });

        // C. Synchronisation en arrière-plan
        await get()._syncAchievementsToCloud();

        return true;
      },

      isUnlocked: (id) => get().unlockedBadges.some((b) => b.id === id),

      getUnlockedAt: (id) => {
        const badge = get().unlockedBadges.find((b) => b.id === id);
        return badge ? badge.unlockedAt : null;
      },

      checkTimelineAchievements: (collectedIds) => {
        // Cette fonction reste synchrone car elle est appelée en boucle
        // Elle appellera unlockBadge qui, lui, gérera la sync async en arrière-plan
        for (const badge of TIMELINE_BADGES) {
          if (get().isUnlocked(badge.id)) continue;
          try {
            if (badge.condition(collectedIds)) {
              get().unlockBadge(badge.id);
            }
          } catch (err) {
            console.error(`Erreur vérification badge ${badge.id}:`, err);
          }
        }
      },

      resetAchievements: () => set({ unlockedBadges: [] }),
    }),
    {
      name: 'metalpedia-achievements',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          // 🛡️ SSR Guard : Si on est sur le serveur, on ne touche pas à IndexedDB
          if (typeof window === 'undefined') return null;
          try {
            const value = await idbGet(name, idbStore);
            if (!value) return null;
            return JSON.parse(value);
          } catch {
            return null;
          }
        },
        setItem: async (name, value) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try {
            await idbSet(name, JSON.stringify(value), idbStore);
          } catch (err) {
            console.error('Failed to persist achievements:', err);
          }
        },
        removeItem: async (name) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try {
            await idbDel(name, idbStore);
          } catch (err) {
            console.error('Failed to remove achievements:', err);
          }
        },
      })),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    }
  )
);

// ═══════════════════════════════════════════════════════════
// HOOKS SÉLECTEURS
// ═══════════════════════════════════════════════════════════
export const useUnlockedBadges = () =>
  useAchievementStore((s) => s.unlockedBadges);

export const useBadgeCount = () =>
  useAchievementStore((s) => s.unlockedBadges.length);
