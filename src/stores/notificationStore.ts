import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export type NotificationType = 'fragment' | 'xp' | 'badge' | 'level' | 'quest';
export type NotificationRarity = 'commun' | 'rare' | 'epique' | 'legendaire';

export interface Notification {
  id: string;
  type: NotificationType;
  rarity: NotificationRarity;
  icon: string;
  title: string;
  description?: string;
  xpGained?: number;
  duration?: number; // ms, défaut 4000
}

export interface Celebration {
  type: 'table_complete' | 'all_tables' | 'milestone';
  pillar?: string;
  icon: string;
  title: string;
  subtitle: string;
  fragmentsCollected?: number;
}

interface NotificationState {
  notifications: Notification[];
  activeCelebration: Celebration | null;
  
  // Actions
  pushNotification: (notif: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  triggerCelebration: (celebration: Celebration) => void;
  closeCelebration: () => void;
}

// ═══════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  activeCelebration: null,

  pushNotification: (notif) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newNotif: Notification = { ...notif, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotif].slice(-5), // Max 5 toasts
    }));

    // Auto-remove après duration
    const duration = notif.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  triggerCelebration: (celebration) => {
    set({ activeCelebration: celebration });
  },

  closeCelebration: () => {
    set({ activeCelebration: null });
  },
}));

// ═══════════════════════════════════════════════════════════
// HELPERS : Configurations par rareté
// ═══════════════════════════════════════════════════════════
export const RARITY_CONFIG: Record<NotificationRarity, {
  color: string;
  glow: string;
  label: string;
  medal: string;
}> = {
  commun:     { color: '#a8a29e', glow: 'rgba(168, 162, 158, 0.4)', label: 'Commun',     medal: '🥉' },
  rare:       { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)',  label: 'Rare',       medal: '🥈' },
  epique:     { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)',  label: 'Épique',     medal: '🥇' },
  legendaire: { color: '#ffd700', glow: 'rgba(255, 215, 0, 0.7)',   label: 'Légendaire', medal: '👑' },
};
